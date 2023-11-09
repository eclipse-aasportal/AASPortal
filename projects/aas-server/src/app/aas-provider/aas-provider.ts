/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { resolve, extname, isAbsolute } from 'path';
import { existsSync, readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import Jimp from 'jimp';
import { Readable } from 'stream';
import {
    AASDocument,
    AASContainer,
    LiveRequest,
    WebSocketData,
    AASServerMessage,
    ApplicationError,
    aas,
    AASWorkspace,
    selectElement,
    AASCursor,
    AASPage,
    AASEndpoint
} from 'common';

import { ImageProcessing } from '../image-processing.js';
import { AASIndex } from './aas-index.js';
import { ScanResultType, ScanResult, ScanStatistic, ScanContainerResult, ScanEndpointResult } from './scan-result.js';
import { Logger } from '../logging/logger.js';
import { Parallel } from './parallel.js';
import { ScanContainerData, ScanEndpointData } from './worker-data.js';
import { SocketClient } from '../live/socket-client.js';
import { EmptySubscription } from '../live/empty-subscription.js';
import { SocketSubscription } from '../live/socket-subscription.js';
import { ERRORS } from '../errors.js';
import { AASResourceFactory } from '../packages/aas-resource-factory.js';
import { AASServerConfiguration, getEndpointName, urlToEndpoint } from '../configuration.js';
import { AASResourceScanFactory } from './aas-resource-scan-factory.js';
import { Variable } from '../variable.js';
import { WSServer } from '../ws-server.js';
import { AASFilter } from './aas-filter.js';

@singleton()
export class AASProvider {
    private readonly configuration: AASServerConfiguration;
    private readonly endpoints = new Map<string, AASEndpoint>();
    private readonly containers = new Map<string, AASContainer>();
    private readonly timeout: number;
    private readonly file: string | undefined;
    private wsServer!: WSServer;
    private readonly tasks = new Map<number, {
        id: string;
        type: 'ScanEndpoint' | 'ScanContainer'
    }>();

    private nextTaskId = 1;

    constructor(
        @inject(Variable) variable: Variable,
        @inject('CONFIGURATION') configuration: string | AASServerConfiguration,
        @inject('Logger') private readonly logger: Logger,
        @inject(Parallel) private readonly parallel: Parallel,
        @inject(AASResourceFactory) private readonly resourceFactory: AASResourceFactory,
        @inject('AASIndex') private readonly index: AASIndex
    ) {
        let currentEndpoints = variable.ENDPOINTS.map(item => urlToEndpoint(item));
        if (typeof configuration === 'string') {
            this.configuration = {
                endpoints: variable.ENDPOINTS.map(endpoint => urlToEndpoint(endpoint))
            };

            this.file = isAbsolute(configuration) ? configuration : resolve('.', configuration);
            if (existsSync(this.file)) {
                try {
                    const value: AASServerConfiguration = JSON.parse(readFileSync(this.file).toString());
                    if (value) {
                        currentEndpoints = value.endpoints;
                    }
                } catch (error) {
                    logger.error(error);
                }
            }
        } else {
            currentEndpoints = configuration.endpoints;
            this.configuration = {
                endpoints: variable.ENDPOINTS.map(endpoint => urlToEndpoint(endpoint))
            };
        }

        this.timeout = variable.TIMEOUT;

        this.initEndpoints(currentEndpoints);

        this.parallel.on('message', this.parallelOnMessage);
        this.parallel.on('end', this.parallelOnEnd);
    }

    public start(wsServer: WSServer): void {
        this.wsServer = wsServer;
        this.wsServer.on('message', this.onClientMessage);

        setTimeout(this.startScan, 100);
    }

    public getWorkspaces(): AASWorkspace[] {
        throw new Error('Not implemented.')
    }

    public async getDocumentsAsync(cursor: AASCursor, filter?: string, language?: string): Promise<AASPage> {
        const minFilterLength = 3;
        if (filter && filter.length >= minFilterLength) {
            return this.index.getDocuments(cursor, new AASFilter(filter, language ?? 'en'));
        }

        return this.index.getDocuments(cursor);
    }

    public async getDocumentAsync(id: string, url?: string): Promise<AASDocument> {
        const document = await this.index.get(url, id);
        const source = this.resourceFactory.create(document.endpoint);
        try {
            await source.openAsync();
            if (!document.content) {
                document.content = await source.createPackage(document.address).readEnvironmentAsync();
            }

            return document;
        } finally {
            await source.closeAsync();
        }
    }

    public async getContentAsync(url: string, id: string): Promise<aas.Environment | undefined> {
        const document: AASDocument = await this.index.get(url, id);
        const source = this.resourceFactory.create(document.endpoint);
        try {
            await source.openAsync();
            return await source.createPackage(document.address).readEnvironmentAsync();
        } finally {
            await source.closeAsync();
        }
    }

    public async getThumbnailAsync(url: string, id: string): Promise<NodeJS.ReadableStream | undefined> {
        const document: AASDocument = await this.index.get(url, id);
        const source = this.resourceFactory.create(document.endpoint);
        try {
            await source.openAsync();
            return await source.createPackage(document.address).getThumbnailAsync(id);
        } finally {
            await source.closeAsync();
        }
    }

    public async getDataElementValueAsync(
        url: string,
        id: string,
        smId: string,
        path: string,
        options?: object
    ): Promise<NodeJS.ReadableStream> {
        const document = await this.index.get(url, id);
        if (!document.content) {
            throw new Error('Invalid operation.')
        }

        let stream: NodeJS.ReadableStream;
        const source = this.resourceFactory.create(document.endpoint);
        try {
            await source.openAsync();
            const pkg = source.createPackage(document.address);
            const dataElement: aas.DataElement | undefined = selectElement(document.content, smId, path);
            if (!dataElement) {
                throw new Error('DataElement not found.');
            }

            if (dataElement.modelType === 'File') {
                const file = dataElement as aas.File;
                stream = await pkg.openReadStreamAsync(document.content, file);
                const extension = file.value ? extname(file.value).toLowerCase() : '';
                const imageOptions = options as { width?: number, height?: number };
                if (file.contentType.startsWith('image/')) {
                    if (imageOptions?.width || imageOptions?.height) {
                        stream = await ImageProcessing.resizeAsync(stream, imageOptions.width, imageOptions.height);
                    }

                    if (extension === '.tiff' || extension === '.tif') {
                        stream = await ImageProcessing.convertAsync(stream, Jimp.MIME_PNG);
                    }
                }
            } else if (dataElement.modelType === 'Blob') {
                const value = await source.getBlobValueAsync(document.content, smId, path);
                const readable = new Readable();
                readable.push(value);
                readable.push(null);
                stream = readable;
            } else {
                throw new Error('Not implemented');
            }
        } finally {
            await source.closeAsync();
        }

        return stream;
    }

    /**
     * Adds a new endpoint.
     * @param name The endpoint name.
     * @param url The endpoint URL.
     */
    public async addEndpointAsync(name: string, endpoint: AASEndpoint): Promise<void> {
        if (this.endpoints.has(name)) {
            throw new ApplicationError(
                `An endpoint with the name "${name}" already exists.`,
                ERRORS.RegistryAlreadyExists,
                name);
        }

        await this.resourceFactory.testAsync(endpoint);

        this.endpoints.set(name, endpoint);

        if (this.file) {
            await this.saveAsync(this.file);
        }

        this.wsServer.notify('WorkspaceChanged', {
            type: 'AASServerMessage',
            data: {
                type: 'EndpointAdded',
                endpoint: endpoint,
            } as AASServerMessage,
        });

        this.startEndpointScan(this.createTaskId(), endpoint, this.createScanStatistic());
    }

    /**
     * Removes the endpoint with the specified name.
     * @param name The name of the registry to remove.
     */
    public async removeEndpointAsync(name: string): Promise<void> {
        throw new Error('Not implemented.');
    }

    /**
     * Restores the default AAS server configuration.
     */
    public async resetAsync(): Promise<void> {
        throw new Error('Not implemented.');
        // this.chain.reset();
        // this.tasks.clear();
        // this.initEndpoints(this.configuration.endpoints);

        // if (this.file && existsSync(this.file)) {
        //     await unlink(this.file);
        // }

        // this.wsServer.notify('WorkspaceChanged', {
        //     type: 'AASServerMessage',
        //     data: {
        //         type: 'Reset',
        //     } as AASServerMessage,
        // });

        // this.startScan();
        // this.logger.info('AAS Server configuration restored.');
    }

    /**
     * Updates an Asset Administration Shell.
     * @param url The AAS container URL.
     * @param id The AAS document ID.
     * @param content The new document content.
     * @returns 
     */
    public async updateDocumentAsync(url: string, id: string, content: aas.Environment): Promise<string[]> {
        throw new Error('Not implemented.');
        // const container = this.chain.getContainer(url);
        // const document = container.find(id);
        // if (!document) {
        //     throw new Error(`The destination document ${id} is not available.`);
        // }

        // const source = this.resourceFactory.create(document.container);
        // try {
        //     await source.openAsync();
        //     const pkg = source.createPackage(document.endpoint.address);
        //     return await pkg.commitDocumentAsync(document, content);
        // }
        // finally {
        //     await source.closeAsync();
        // }
    }

    /**
     * Downloads an AASX package.
     * @param id The AAS identifier.
     * @param url The source URL.
     * @returns A readable stream.
     */
    public async getPackageAsync(id: string, url: string): Promise<NodeJS.ReadableStream> {
        const document = await this.index.get(url, id);
        const source = this.resourceFactory.create(document.endpoint);
        try {
            await source.openAsync();
            return await source.getPackageAsync(id, document.address);
        } finally {
            await source.closeAsync();
        }
    }

    /**
     * Uploads an AASX package.
     * @param files The AASX package file.
     * @param url The destination URL.
     */
    public async addPackagesAsync(url: string, files: Express.Multer.File[]): Promise<void> {
        throw new Error('Not implemented.');
        // if (!this.chain.hasContainer(url)) {
        //     throw new ApplicationError(
        //         `An AAS container with the URL "${url}" does not exist.`,
        //         ERRORS.ContainerDoesNotExist,
        //         url);
        // }

        // const source = this.resourceFactory.create(url);
        // try {
        //     await source.openAsync();
        //     for (const file of files) {
        //         const aasPackage = await source.postPackageAsync(file);
        //         if (aasPackage) {
        //             const document = await aasPackage.createDocumentAsync();
        //             await this.chain.addAsync(document);
        //             this.notify({ type: 'Added', document: { ...document, content: null } });
        //         }
        //     }
        // } finally {
        //     await source.closeAsync();
        // }
    }

    /**
     * Deletes an AASX package from an endpoint.
     * @param url The container URL.
     * @param id The AAS identification.
     */
    public async deletePackageAsync(url: string, id: string): Promise<void> {
        throw new Error('Not implemented.');
        // const container = this.chain.getContainer(url);
        // const document = await container.get(id);
        // if (document) {
        //     const source = this.resourceFactory.create(url);
        //     try {
        //         await source.deletePackageAsync(document.id, document.endpoint.address);
        //         await container.deleteAsync(id);
        //         this.notify({ type: 'Removed', document: { ...document, content: null } });
        //     } finally {
        //         await source.closeAsync();
        //     }
        // }
    }

    /** Only used for test. */
    public async scanAsync(factory: AASResourceScanFactory): Promise<void> {
        for (const endpoint of this.endpoints.values()) {
            if (endpoint.type === 'AasxDirectory') {
                const documents = await factory.create(endpoint).scanAsync();
                documents.forEach(async (document) => await this.index.add(document));
            }
        }
    }

    /**
     * Invokes an operation synchronous.
     * @param url The URL of the AAS container.
     * @param id The AAS identifier.
     * @param operation The Operation element.
     * @returns ToDo.
     */
    public async invoke(url: string, id: string, operation: aas.Operation): Promise<aas.Operation> {
        const document = await this.index.get(url, id);
        const resource = this.resourceFactory.create(document.endpoint);
        try {
            await resource.openAsync();
            return await resource.invoke(document.content!, operation);
        } finally {
            await resource.closeAsync()
        }
    }

    private initEndpoints(endpoints: AASEndpoint[]): void {
        this.endpoints.clear();
        endpoints.forEach(item => {
            try {
                if (!this.endpoints.has(item.name)) {
                    this.endpoints.set(item.name, item);
                } else {
                    this.logger.error(`An endpoint with the name "${name}" already exists.`);
                }
            } catch (error) {
                this.logger.error(`"${item}" is an invalid endpoint URL.`);
            }
        });
    }

    private onClientMessage = async (data: WebSocketData, client: SocketClient): Promise<void> => {
        try {
            switch (data.type) {
                case 'LiveRequest':
                    client.subscribe(data.type, await this.createSubscription(data.data as LiveRequest, client));
                    break;
                case 'WorkspaceChanged':
                    client.subscribe(data.type, new EmptySubscription());
                    break;
                default:
                    throw new Error(`'${data.type}' is an unsupported Websocket message type.`);
            }
        } catch (error) {
            this.logger.error(error);
        }
    };

    private async createSubscription(message: LiveRequest, client: SocketClient): Promise<SocketSubscription> {
        throw new Error('Not implemented.');

        // const source = this.resourceFactory.create(message.url);
        // const env = this.chain.get(message.url, message.id!).content!;
        // await source.openAsync();
        // return source.createSubscription(client, message, env);
    }

    private startScan = async (): Promise<void> => {
        try {
            for (const endpoint of this.endpoints.values()) {
                this.startEndpointScan(this.createTaskId(), endpoint, this.createScanStatistic());
            }
        } catch (error) {
            this.logger.error(error);
        }
    };

    private parallelOnEnd = (result: ScanResult): void => {
        const task = this.tasks.get(result.taskId);
        if (task) {
            this.tasks.delete(result.taskId);
            if (task.type === 'ScanContainer') {
                const endpoint = this.endpoints.get(task.id);
                if (endpoint) {
                    this.index.getContainerDocuments(endpoint.url).then(documents => {
                        setTimeout(
                            this.startContainerScan,
                            this.timeout,
                            result.taskId,
                            { name: task.id, container: endpoint, documents },
                            result.statistic);
                    }).catch(error => this.logger.error(error));
                }
            } else if (task.type === 'ScanEndpoint') {
                const endpoint = this.endpoints.get(task.id);
                if (endpoint) {
                    setTimeout(this.startEndpointScan, this.timeout, result.taskId, endpoint, result.statistic);
                }
            }
        }

        if (result.messages) {
            this.logger.start(`scan ${task?.id ?? 'undefined'}`);
            result.messages.forEach(message => this.logger.log(message));
            this.logger.stop();
        }
    };

    private startEndpointScan = (taskId: number, endpoint: AASEndpoint, statistic: ScanStatistic) => {
        const data: ScanEndpointData = {
            type: 'ScanEndpointData',
            taskId: taskId,
            statistic: statistic,
            endpoint: endpoint,
            containers: [...this.containers.values()]
        };

        this.tasks.set(taskId, { id: endpoint.name, type: 'ScanEndpoint' });
        this.parallel.execute(data);
    };

    private startContainerScan = (taskId: number, container: AASContainer, statistic: ScanStatistic) => {
        const data: ScanContainerData = {
            type: 'ScanContainerData',
            taskId,
            statistic,
            container
        };

        this.tasks.set(taskId, { id: container.name, type: 'ScanContainer' });
        this.parallel.execute(data);
    };

    private notify(data: AASServerMessage): void {
        this.wsServer.notify('WorkspaceChanged',
            {
                type: 'AASServerMessage',
                data: data
            });
    }

    private parallelOnMessage = (result: ScanResult) => {
        try {
            switch (result.type) {
                case ScanResultType.Changed:
                    this.onChanged(result as ScanContainerResult);
                    break;
                case ScanResultType.Added:
                    this.onAdded(result as ScanContainerResult);
                    break;
                case ScanResultType.Removed:
                    this.onRemoved(result as ScanContainerResult);
                    break;
                case ScanResultType.ContainerAdded:
                    this.onContainerAdded(result as ScanEndpointResult);
                    break;
                case ScanResultType.ContainerRemoved:
                    this.onContainerRemoved(result as ScanEndpointResult);
                    break;
            }
        } catch (error) {
            this.logger.error(error);
        }
    };

    private async onChanged(result: ScanContainerResult): Promise<void> {
        await this.index.set(result.document);
        this.logger.info(`Changed: AAS ${result.document.idShort} [${result.document.id}] in ${result.container.url}`);
        this.sendMessage({ type: 'Changed', document: { ...result.document, content: null } });
    }

    private async onAdded(result: ScanContainerResult): Promise<void> {
        await this.index.add(result.document);
        this.logger.info(`Added: AAS ${result.document.idShort} [${result.document.id}] in ${result.container.url}`);
        this.sendMessage({ type: 'Added', document: { ...result.document, content: result.document ? null : undefined } });
    }

    private async onRemoved(result: ScanContainerResult): Promise<void> {
        await this.index.delete(result.container.url, result.document.id);
        this.logger.info(`Removed: AAS ${result.document.idShort} [${result.document.id}] in ${result.container.url}`);
        this.sendMessage({ type: 'Removed', document: { ...result.document, content: null } });
    }

    private onContainerAdded(result: ScanEndpointResult): void {
        this.containers.set(result.endpoint.name, { ...result.endpoint });
        if (this.endpoints.has(result.endpoint.name)) {
            this.index.getContainerDocuments(result.endpoint.url).then(documents => {
                setTimeout(
                    this.startContainerScan,
                    this.timeout,
                    this.createTaskId(),
                    { ...result.container, documents },
                    this.createScanStatistic()
                );

                this.sendMessage({ type: 'ContainerAdded', endpoint: result.endpoint, container: result.container });
            }).catch(error => this.logger.error(error));
        }
    }

    private async onContainerRemoved(result: ScanEndpointResult): Promise<void> {
        await this.index.delete(result.container.url);
        this.sendMessage({ type: 'ContainerRemoved', endpoint: result.endpoint, container: result.container });
    }

    private sendMessage(data: AASServerMessage) {
        this.wsServer.notify('WorkspaceChanged', {
            type: 'AASServerMessage',
            data: data
        });
    }

    // private async getAASDocumentAsync(reference: aas.Key): Promise<AASDocument> {
    //     const document = await this.selectDocumentAsync((document) => {
    //         return document.idShort === reference.value || document.id === reference.value;
    //     });

    //     if (!document) {
    //         throw new Error(`An AAS with the identification '${reference.value}' does not exist.`);
    //     }

    //     return document;
    // }

    private getUrl(url: string): string {
        return url.split('?')[0];
    }

    private createTaskId(): number {
        const taskId = this.nextTaskId;
        ++this.nextTaskId;
        return taskId;
    }

    private async saveAsync(path: string): Promise<void> {
        const configuration: AASServerConfiguration = {
            endpoints: [...this.endpoints.values()]
        };

        await writeFile(path, JSON.stringify(configuration));
    }

    private createScanStatistic(): ScanStatistic {
        return {
            start: 0,
            end: 0,
            counter: 0,
            changed: 0,
            new: 0,
            deleted: 0,
            offline: 0,
        };
    }
}