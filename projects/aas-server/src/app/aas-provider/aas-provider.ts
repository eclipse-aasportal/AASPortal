/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { extname } from 'path';
import Jimp from 'jimp';
import { Readable } from 'stream';
import {
    AASDocument,
    LiveRequest,
    WebSocketData,
    AASServerMessage,
    aas,
    selectElement,
    AASCursor,
    AASPage,
    AASEndpoint,
    ApplicationError,
    getChildren,
} from 'common';

import { ImageProcessing } from '../image-processing.js';
import { AASIndex } from '../aas-index/aas-index.js';
import { ScanResultType, ScanResult, ScanStatistic, ScanContainerResult } from './scan-result.js';
import { Logger } from '../logging/logger.js';
import { Parallel } from './parallel.js';
import { ScanContainerData } from './worker-data.js';
import { SocketClient } from '../live/socket-client.js';
import { EmptySubscription } from '../live/empty-subscription.js';
import { SocketSubscription } from '../live/socket-subscription.js';
import { AASResourceFactory } from '../packages/aas-resource-factory.js';
import { AASResourceScanFactory } from './aas-resource-scan-factory.js';
import { Variable } from '../variable.js';
import { WSServer } from '../ws-server.js';
import { ERRORS } from '../errors.js';

@singleton()
export class AASProvider {
    private readonly timeout: number;
    private readonly file: string | undefined;
    private wsServer!: WSServer;
    private readonly tasks = new Map<
        number,
        {
            id: string;
            type: 'ScanEndpoint' | 'ScanContainer';
        }
    >();

    private nextTaskId = 1;

    public constructor(
        @inject(Variable) variable: Variable,
        @inject('Logger') private readonly logger: Logger,
        @inject(Parallel) private readonly parallel: Parallel,
        @inject(AASResourceFactory) private readonly resourceFactory: AASResourceFactory,
        @inject('AASIndex') private readonly index: AASIndex,
    ) {
        this.timeout = variable.TIMEOUT;
        this.parallel.on('message', this.parallelOnMessage);
        this.parallel.on('end', this.parallelOnEnd);
    }

    /**
     * Starts the AAS provider.
     * @param wsServer The web socket server instance.
     */
    public start(wsServer: WSServer): void {
        this.wsServer = wsServer;
        this.wsServer.on('message', this.onClientMessage);
        setTimeout(this.startScan, 100);
    }

    /** Gets all registered AAS container endpoints. */
    public getEndpoints(): Promise<AASEndpoint[]> {
        return this.index.getEndpoints();
    }

    public async getDocumentsAsync(cursor: AASCursor, filter?: string, language?: string): Promise<AASPage> {
        const minFilterLength = 3;
        if (filter && filter.length >= minFilterLength) {
            return this.index.getDocuments(cursor, filter, language ?? 'en');
        }

        return this.index.getDocuments(cursor);
    }

    public async getDocumentAsync(id: string, name?: string): Promise<AASDocument> {
        const document = await this.index.get(name, id);
        const endpoint = await this.index.getEndpoint(document.endpoint);
        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            if (!document.content) {
                document.content = await resource.createPackage(document.address).readEnvironmentAsync();
            }

            return document;
        } finally {
            await resource.closeAsync();
        }
    }

    public async getContentAsync(name: string, id: string): Promise<aas.Environment> {
        const endpoint = await this.index.getEndpoint(name);
        const document = await this.index.get(name, id);
        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            return await resource.createPackage(document.address).readEnvironmentAsync();
        } finally {
            await resource.closeAsync();
        }
    }

    public async getThumbnailAsync(name: string, id: string): Promise<NodeJS.ReadableStream | undefined> {
        const endpoint = await this.index.getEndpoint(name);
        const document = await this.index.get(name, id);
        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            return await resource.createPackage(document.address).getThumbnailAsync(id);
        } finally {
            await resource.closeAsync();
        }
    }

    public async getDataElementValueAsync(
        name: string,
        id: string,
        smId: string,
        path: string,
        options?: object,
    ): Promise<NodeJS.ReadableStream> {
        const endpoint = await this.index.getEndpoint(name);
        const document = await this.index.get(name, id);
        let stream: NodeJS.ReadableStream;
        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            const pkg = resource.createPackage(document.address);
            if (!document.content) {
                document.content = await pkg.readEnvironmentAsync();
            }

            const dataElement: aas.DataElement | undefined = selectElement(document.content, smId, path);
            if (!dataElement) {
                throw new Error('DataElement not found.');
            }

            if (dataElement.modelType === 'File') {
                const file = dataElement as aas.File;
                stream = await pkg.openReadStreamAsync(document.content, file);
                const extension = file.value ? extname(file.value).toLowerCase() : '';
                const imageOptions = options as { width?: number; height?: number };
                if (file.contentType.startsWith('image/')) {
                    if (imageOptions?.width || imageOptions?.height) {
                        stream = await ImageProcessing.resizeAsync(stream, imageOptions.width, imageOptions.height);
                    }

                    if (extension === '.tiff' || extension === '.tif') {
                        stream = await ImageProcessing.convertAsync(stream, Jimp.MIME_PNG);
                    }
                }
            } else if (dataElement.modelType === 'Blob') {
                const value = await resource.getBlobValueAsync(document.content, smId, path);
                const readable = new Readable();
                readable.push(value);
                readable.push(null);
                stream = readable;
            } else {
                throw new Error('Not implemented');
            }
        } finally {
            await resource.closeAsync();
        }

        return stream;
    }

    /**
     * Adds a new endpoint.
     * @param name The endpoint name.
     * @param url The endpoint URL.
     */
    public async addEndpointAsync(name: string, endpoint: AASEndpoint): Promise<void> {
        await this.resourceFactory.testAsync(endpoint);
        await this.index.addEndpoint(endpoint);
        this.wsServer.notify('WorkspaceChanged', {
            type: 'AASServerMessage',
            data: {
                type: 'EndpointAdded',
                endpoint: endpoint,
            } as AASServerMessage,
        });

        this.startContainerScan(this.createTaskId(), endpoint, this.createScanStatistic());
    }

    /**
     * Removes the endpoint with the specified name.
     * @param name The name of the registry to remove.
     */
    public async removeEndpointAsync(name: string): Promise<void> {
        const endpoint = await this.index.getEndpoint(name);
        if (endpoint) {
            await this.index.removeEndpoint(name);
            this.wsServer.notify('WorkspaceChanged', {
                type: 'AASServerMessage',
                data: {
                    type: 'EndpointRemoved',
                    endpoint: endpoint,
                } as AASServerMessage,
            });
        }
    }

    /**
     * Restores the default AAS server configuration.
     */
    public async resetAsync(): Promise<void> {
        this.tasks.clear();
        await this.index.reset();

        this.wsServer.notify('WorkspaceChanged', {
            type: 'AASServerMessage',
            data: {
                type: 'Reset',
            } as AASServerMessage,
        });

        this.startScan();
        this.logger.info('AAS Server configuration restored.');
    }

    /**
     * Updates an Asset Administration Shell.
     * @param name The endpoint name.
     * @param id The AAS document ID.
     * @param content The new document content.
     * @returns
     */
    public async updateDocumentAsync(name: string, id: string, content: aas.Environment): Promise<string[]> {
        const endpoint = await this.index.getEndpoint(name);
        const document = await this.index.get(name, id);
        if (!document) {
            throw new Error(`The destination document ${id} is not available.`);
        }

        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            const pkg = resource.createPackage(document.address);
            if (!document.content) {
                document.content = await pkg.readEnvironmentAsync();
            }

            return await pkg.commitDocumentAsync(document, content);
        } finally {
            await resource.closeAsync();
        }
    }

    /**
     * Downloads an AASX package.
     * @param name The endpoint name.
     * @param id The AAS identifier.
     * @returns A readable stream.
     */
    public async getPackageAsync(name: string, id: string): Promise<NodeJS.ReadableStream> {
        const endpoint = await this.index.getEndpoint(name);
        const document = await this.index.get(name, id);
        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            return await resource.getPackageAsync(id, document.address);
        } finally {
            await resource.closeAsync();
        }
    }

    /**
     * Uploads an AASX package.
     * @param name The name of the destination endpoint.
     * @param files The AASX package file.
     */
    public async addPackagesAsync(name: string, files: Express.Multer.File[]): Promise<void> {
        const endpoint = await this.index.getEndpoint(name);
        if (!endpoint) {
            throw new ApplicationError(
                `An AAS container with the name "${name}" does not exist.`,
                ERRORS.ContainerDoesNotExist,
                name,
            );
        }

        const source = this.resourceFactory.create(endpoint);
        try {
            await source.openAsync();
            for (const file of files) {
                await source.postPackageAsync(file);
            }
        } finally {
            await source.closeAsync();
        }
    }

    /**
     * Deletes an AASX package from an endpoint.
     * @param name The endpoint name.
     * @param id The AAS identification.
     */
    public async deletePackageAsync(name: string, id: string): Promise<void> {
        const endpoint = await this.index.getEndpoint(name);
        const document = await this.index.get(name, id);
        if (document) {
            const resource = this.resourceFactory.create(endpoint);
            try {
                await resource.deletePackageAsync(document.id, document.address);
                await this.index.remove(name, id);
                this.notify({ type: 'Removed', document: { ...document, content: null } });
            } finally {
                await resource.closeAsync();
            }
        }
    }

    /** Only used for test. */
    public async scanAsync(factory: AASResourceScanFactory): Promise<void> {
        for (const endpoint of await this.index.getEndpoints()) {
            if (endpoint.type === 'AasxDirectory') {
                const documents = await factory.create(endpoint).scanAsync();
                documents.forEach(async document => await this.index.add(document));
            }
        }
    }

    /**
     * Invokes an operation synchronous.
     * @param name The endpoint name.
     * @param id The AAS identifier.
     * @param operation The Operation element.
     * @returns ToDo.
     */
    public async invoke(name: string, id: string, operation: aas.Operation): Promise<aas.Operation> {
        const endpoint = await this.index.getEndpoint(name);
        const document = await this.index.get(name, id);
        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            return await resource.invoke(document.content!, operation);
        } finally {
            await resource.closeAsync();
        }
    }

    /**
     *
     * @param endpoint The endpoint name.
     * @param id The AAS identifier.
     * @returns
     */
    public async getHierarchyAsync(endpoint: string, id: string): Promise<AASDocument[]> {
        const document = await this.index.get(endpoint, id);
        const root: AASDocument = { ...document, parent: null, content: null };
        const nodes: AASDocument[] = [root];
        await this.collectDescendants(root, nodes);
        return nodes;
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
        const endpoint = await this.index.getEndpoint(message.endpoint);
        const document = await this.index.get(message.endpoint, message.id);
        const resource = this.resourceFactory.create(endpoint);
        await resource.openAsync();
        const env = await resource.createPackage(document.address).readEnvironmentAsync();
        return resource.createSubscription(client, message, env);
    }

    private startScan = async (): Promise<void> => {
        try {
            for (const endpoint of await this.index.getEndpoints()) {
                await this.startContainerScan(this.createTaskId(), endpoint, this.createScanStatistic());
            }
        } catch (error) {
            this.logger.error(error);
        }
    };

    private parallelOnEnd = async (result: ScanResult) => {
        const task = this.tasks.get(result.taskId);
        if (task) {
            this.tasks.delete(result.taskId);
            if (task.type === 'ScanContainer') {
                const endpoint = await this.index.getEndpoint(task.id);
                if (endpoint) {
                    setTimeout(this.startContainerScan, this.timeout, result.taskId, endpoint, result.statistic);
                }
            }
        }

        if (result.messages) {
            this.logger.start(`scan ${task?.id ?? 'undefined'}`);
            result.messages.forEach(message => this.logger.log(message));
            this.logger.stop();
        }
    };

    private startContainerScan = async (taskId: number, endpoint: AASEndpoint, statistic: ScanStatistic) => {
        const documents = await this.index.getContainerDocuments(endpoint.name);
        const data: ScanContainerData = {
            type: 'ScanContainerData',
            taskId,
            statistic,
            container: { ...endpoint, documents },
        };

        this.tasks.set(taskId, { id: endpoint.name, type: 'ScanContainer' });
        this.parallel.execute(data);
    };

    private notify(data: AASServerMessage): void {
        this.wsServer.notify('WorkspaceChanged', {
            type: 'AASServerMessage',
            data: data,
        });
    }

    private parallelOnMessage = async (result: ScanResult) => {
        try {
            switch (result.type) {
                case ScanResultType.Changed:
                    await this.onChanged(result as ScanContainerResult);
                    break;
                case ScanResultType.Added:
                    await this.onAdded(result as ScanContainerResult);
                    break;
                case ScanResultType.Removed:
                    await this.onRemoved(result as ScanContainerResult);
                    break;
            }
        } catch (error) {
            this.logger.error(error);
        }
    };

    private async onChanged(result: ScanContainerResult): Promise<void> {
        await this.index.update(result.document);
        this.sendMessage({ type: 'Changed', document: { ...result.document, content: null } });
    }

    private async onAdded(result: ScanContainerResult): Promise<void> {
        await this.index.add(result.document);
        this.logger.info(`Added: AAS ${result.document.idShort} [${result.document.id}] in ${result.container.url}`);
        this.sendMessage({ type: 'Added', document: result.document });
    }

    private async onRemoved(result: ScanContainerResult): Promise<void> {
        await this.index.remove(result.container.name, result.document.id);
        this.logger.info(`Removed: AAS ${result.document.idShort} [${result.document.id}] in ${result.container.url}`);
        this.sendMessage({ type: 'Removed', document: { ...result.document, content: null } });
    }

    private sendMessage(data: AASServerMessage) {
        this.wsServer.notify('WorkspaceChanged', {
            type: 'AASServerMessage',
            data: data,
        });
    }

    private createTaskId(): number {
        const taskId = this.nextTaskId;
        ++this.nextTaskId;
        return taskId;
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

    private async collectDescendants(parent: AASDocument, nodes: AASDocument[]): Promise<void> {
        const content = await this.getDocumentContentAsync(parent);
        for (const reference of this.whereReferenceElement(content.submodels)) {
            const childId = reference.value.keys[0].value;
            const child =
                (await this.index.find(parent.endpoint, childId)) ?? (await this.index.find(undefined, childId));
            if (child) {
                const node: AASDocument = { ...child, parent: { ...parent }, content: null };
                nodes.push(node);
                await this.collectDescendants(node, nodes);
            }
        }
    }

    private *whereReferenceElement(elements: aas.Referable[]): Generator<aas.ReferenceElement> {
        const stack: aas.Referable[][] = [];
        stack.push(elements);
        while (stack.length > 0) {
            const children = stack.pop() as aas.Referable[];
            for (const child of children) {
                if (child.modelType === 'ReferenceElement') {
                    const value = child as aas.ReferenceElement;
                    if (value && value.value.keys.some(item => item.type === 'AssetAdministrationShell')) {
                        yield value;
                    }
                }

                const children = getChildren(child);
                if (children.length > 0) {
                    stack.push(children);
                }
            }
        }
    }

    public async getDocumentContentAsync(document: AASDocument): Promise<aas.Environment> {
        const endpoint = await this.index.getEndpoint(document.endpoint);
        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            return await resource.createPackage(document.address).readEnvironmentAsync();
        } finally {
            await resource.closeAsync();
        }
    }
}