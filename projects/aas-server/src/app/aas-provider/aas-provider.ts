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
import { unlink, writeFile } from 'fs/promises';
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
    isUrlSafeBase64,
    selectElement
} from 'common';

import { ImageProcessing } from '../image-processing.js';
import { AASCache } from './aas-cache.js';
import { ScanResultType, ScanResult, ScanStatistic, ScanContainerResult, ScanEndpointResult } from './scan-result.js';
import { Logger } from '../logging/logger.js';
import { Container } from './container.js';
import { Parallel } from './parallel.js';
import { ScanContainerData, ScanEndpointData } from './worker-data.js';
import { SocketClient } from '../live/socket-client.js';
import { EmptySubscription } from '../live/empty-subscription.js';
import { SocketSubscription } from '../live/socket-subscription.js';
import { ERRORS } from '../errors.js';
import { AASResourceFactory } from '../packages/aas-resource-factory.js';
import { decodeBase64Url } from '../convert.js';
import { AASServerConfiguration, createEndpoint, getEndpointName, getEndpointType } from '../configuration.js';
import { AASResourceScanFactory } from './aas-resource-scan-factory.js';
import { Variable } from '../variable.js';
import { WSServer } from '../ws-server.js';

@singleton()
export class AASProvider {
    private readonly configuration: AASServerConfiguration;
    private readonly endpoints = new Map<string, URL>();
    private readonly timeout: number;
    private readonly cache = new AASCache();
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
        @inject(AASResourceFactory) private readonly resourceFactory: AASResourceFactory
    ) {
        let currentEndpoints = variable.ENDPOINTS;
        if (typeof configuration === 'string') {
            this.configuration = {
                endpoints: variable.ENDPOINTS.map(endpoint => createEndpoint(endpoint).href)
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
                endpoints: variable.ENDPOINTS.map(endpoint => createEndpoint(endpoint).href)
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
        const items: AASWorkspace[] = [];
        for (const endpoint of this.endpoints.values()) {
            const containers: AASContainer[] = [];
            for (const container of this.cache.containers) {
                if (container.isAssignedTo(endpoint)) {
                    containers.push({
                        url: container.url.href,
                        name: container.name
                    });
                }
            }

            items.push({
                name: getEndpointName(endpoint),
                containers: containers
            });
        }

        return items;
    }

    public getContainer(url: string): Container {
        const container = this.cache.getContainer(url);
        if (!container) {
            throw new Error(`A container with the URL "${url}" does not exist.`);
        }

        return container;
    }

    public getDocuments(url: string): AASDocument[] {
        const documents: AASDocument[] = [];
        for (const document of this.cache.getContainer(url).documents) {
            documents.push({ ...document, content: document.content ? null : undefined })
        }

        return documents;
    }

    public getDocument(id: string, url?: string): AASDocument {
        let document: AASDocument | undefined;
        if (url) {
            document = this.cache.get(url, id);
        } else {
            let decodedId: string | undefined;
            try {
                if (isUrlSafeBase64(id)) {
                    decodedId = decodeBase64Url(id);
                }
            } catch (_) { }

            document = this.cache.find((document) => document.id === id || document.idShort === id || document.id === decodedId);
        }

        if (!document) {
            throw new Error(`An AAS with the identification ${id} does not exist.`);
        }

        return { ...document, content: document.content ? null : undefined };
    }

    public async getContentAsync(url: string, id: string): Promise<aas.Environment | undefined> {
        const document: AASDocument = this.cache.get(url, id);
        if (!document.content) {
            throw new Error(`${id} has an unexpected empty content.`);
        }

        return document.content;
    }

    public async getThumbnailAsync(url: string, id: string): Promise<NodeJS.ReadableStream | undefined> {
        const document: AASDocument = this.cache.get(url, id);
        const source = this.resourceFactory.create(document.container);
        try {
            await source.openAsync();
            const pkg = source.createPackage(document.endpoint.address);
            return await pkg.getThumbnailAsync();
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
        const document = this.cache.get(url, id);
        if (!document.content) {
            throw new Error('Invalid operation.')
        }

        let stream: NodeJS.ReadableStream;
        const source = this.resourceFactory.create(document.container);
        try {
            await source.openAsync();
            const pkg = source.createPackage(document.endpoint.address);
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
    public async addEndpointAsync(name: string, url: URL): Promise<void> {
        if (this.endpoints.has(name)) {
            throw new ApplicationError(
                `An endpoint with the name "${name}" already exists.`,
                ERRORS.RegistryAlreadyExists,
                name);
        }

        await this.resourceFactory.testAsync(url);

        this.endpoints.set(name, url);

        if (this.file) {
            await this.saveAsync(this.file);
        }

        this.wsServer.notify('WorkspaceChanged', {
            type: 'AASServerMessage',
            data: {
                type: 'EndpointAdded',
                endpoint: url.href,
            } as AASServerMessage,
        });

        this.startEndpointScan(this.createTaskId(), url, this.createScanStatistic());
    }

    /**
     * Removes the endpoint with the specified name.
     * @param name The name of the registry to remove.
     */
    public async removeEndpointAsync(name: string): Promise<void> {
        const endpoint = this.endpoints.get(name);
        if (!endpoint) {
            throw new Error(`An endpoint with the name '${name}' does not exist.`);
        }

        this.endpoints.delete(name);

        for (const container of [...this.cache.containers]) {
            if (container.isAssignedTo(endpoint) && container.unassignFrom(endpoint)) {
                this.cache.deleteContainer(container);

                this.logger.info(`Container '${container}' removed.`);
                this.wsServer.notify('WorkspaceChanged', {
                    type: 'AASServerMessage',
                    data: {
                        type: 'ContainerRemoved',
                        endpoint: endpoint.href,
                        container: { name: container.name, url: container.url.href }
                    } as AASServerMessage,
                });
            }
        }

        this.wsServer.notify('WorkspaceChanged', {
            type: 'AASServerMessage',
            data: {
                type: 'EndpointRemoved',
                endpoint: endpoint.href,
            } as AASServerMessage,
        });

        if (this.file) {
            await this.saveAsync(this.file);
        }
    }

    /**
     * Restores the default AAS server configuration.
     */
    public async resetAsync(): Promise<void> {
        this.cache.reset();
        this.tasks.clear();
        this.initEndpoints(this.configuration.endpoints);

        if (this.file && existsSync(this.file)) {
            await unlink(this.file);
        }

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
     * @param url The AAS container URL.
     * @param id The AAS document ID.
     * @param content The new document content.
     * @returns 
     */
    public async updateDocumentAsync(url: string, id: string, content: aas.Environment): Promise<string[]> {
        const container = this.cache.getContainer(url);
        const document = container.find(id);
        if (!document) {
            throw new Error(`The destination document ${id} is not available.`);
        }

        const source = this.resourceFactory.create(document.container);
        try {
            await source.openAsync();
            const pkg = source.createPackage(document.endpoint.address);
            return await pkg.commitDocumentAsync(document, content);
        }
        finally {
            await source.closeAsync();
        }
    }

    /**
     * Downloads an AASX package.
     * @param id The AAS identifier.
     * @param url The source URL.
     * @returns A readable stream.
     */
    public async getDocumentAsync(id: string, url: string): Promise<NodeJS.ReadableStream> {
        const document = this.cache.get(url, id);
        const source = this.resourceFactory.create(document.container);
        try {
            await source.openAsync();
            return await source.getPackageAsync(id, document.endpoint.address);
        } finally {
            await source.closeAsync();
        }
    }

    /**
     * Uploads an AASX package.
     * @param files The AASX package file.
     * @param url The destination URL.
     */
    public async addDocumentsAsync(url: string, files: Express.Multer.File[]): Promise<void> {
        if (!this.cache.hasContainer(url)) {
            throw new Error(`The AAS container "${url}" does not exist.`);
        }

        const source = this.resourceFactory.create(url);
        try {
            await source.openAsync();
            for (const file of files) {
                const aasPackage = await source.postPackageAsync(file);
                if (aasPackage) {
                    const document = await aasPackage.createDocumentAsync();
                    this.cache.add(document);
                    this.notify({ type: 'Added', document: { ...document, content: null } });
                }
            }
        } finally {
            await source.closeAsync();
        }
    }

    /**
     * Deletes an AASX package from an endpoint.
     * @param url The container URL.
     * @param id The AAS identification.
     */
    public async deleteDocumentAsync(url: string, id: string): Promise<void> {
        const container = this.cache.getContainer(url);
        const document = container.get(id);
        if (document) {
            const source = this.resourceFactory.create(url);
            try {
                await source.deletePackageAsync(document.id, document.endpoint.address);
                container.remove(id);
                this.notify({ type: 'Removed', document: { ...document, content: null } });
            } finally {
                await source.closeAsync();
            }
        }
    }

    /** Only used for test. */
    public async scanAsync(factory: AASResourceScanFactory): Promise<void> {
        for (const endpoint of this.endpoints.values()) {
            if (getEndpointType(endpoint) === 'AasxDirectory') {
                const descriptor: AASContainer = {
                    name: getEndpointName(endpoint),
                    url: endpoint.href,
                    documents: []
                };

                this.cache.addNewContainer(descriptor, endpoint.href);
                const documents = await factory.create(endpoint.href).scanAsync();
                documents.forEach(document => this.cache.add(document));
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
        const document = this.cache.get(url, id);
        const resource = this.resourceFactory.create(document.container);
        try {
            await resource.openAsync();
            return await resource.invoke(document.content!, operation);
        } finally {
            await resource.closeAsync()
        }
    }

    private initEndpoints(endpoints: string[]): void {
        this.endpoints.clear();
        endpoints.forEach(item => {
            try {
                const url = new URL(item);
                const name = getEndpointName(url);
                if (!this.endpoints.has(name)) {
                    this.endpoints.set(name, url);
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
        const source = this.resourceFactory.create(message.url);
        const env = this.cache.get(message.url, message.id!).content!;
        await source.openAsync();
        return source.createSubscription(client, message, env);
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
                if (this.cache.hasContainer(task.id)) {
                    const container = this.cache.getContainer(task.id);
                    setTimeout(this.startContainerScan.bind(this), this.timeout, result.taskId, container, result.statistic);
                }
            } else if (task.type === 'ScanEndpoint') {
                const endpoint = this.endpoints.get(task.id);
                if (endpoint) {
                    setTimeout(this.startEndpointScan.bind(this), this.timeout, result.taskId, endpoint, result.statistic);
                }
            }
        }

        if (result.messages) {
            this.logger.start(`scan ${task?.id ?? 'undefined'}`);
            result.messages.forEach(message => this.logger.log(message));
            this.logger.stop();
        }
    };

    private startEndpointScan(taskId: number, endpoint: URL, statistic: ScanStatistic) {
        const containers: AASContainer[] = [];
        for (const container of this.cache.containers) {
            if (container.isAssignedTo(endpoint)) {
                containers.push({
                    url: container.url.href,
                    name: container.name
                })
            }
        }

        const data: ScanEndpointData = {
            type: 'ScanEndpointData',
            taskId: taskId,
            statistic: statistic,
            endpoint: endpoint.href,
            containers: containers
        };

        this.tasks.set(taskId, { id: getEndpointName(endpoint), type: 'ScanEndpoint' });
        this.parallel.execute(data);
    }

    private startContainerScan(taskId: number, container: Container, statistic: ScanStatistic) {
        const data: ScanContainerData = {
            type: 'ScanContainerData',
            taskId: taskId,
            statistic: statistic,
            container: {
                url: container.url.href,
                name: container.name,
                documents: [...container.documents]
            }
        };

        this.tasks.set(taskId, { id: container.url.href, type: 'ScanContainer' });
        this.parallel.execute(data);
    }

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
                case ScanResultType.Offline:
                    this.onOffline(result as ScanContainerResult);
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

    private onChanged(result: ScanContainerResult): void {
        if (!this.cache.set(result.document)) {
            this.logger.info(`Changed: AAS ${result.document.idShort} [${result.document.id}] in ${result.container.url}`);
        } else {
            this.logger.error(`AAS ${result.document.idShort} [${result.document.id}] in ${result.container.url} does not exist.`);
        }

        this.sendMessage({ type: 'Changed', document: { ...result.document, content: null } });
    }

    private onAdded(result: ScanContainerResult): void {
        if (this.cache.set(result.document)) {
            this.logger.info(`Added: AAS ${result.document.idShort} [${result.document.id}] in ${result.container.url}`);
        } else {
            this.logger.error(
                `AAS ${result.document.idShort} [${result.document.id}] in ${result.container.url} already added.`);
        }

        this.sendMessage({ type: 'Added', document: { ...result.document, content: result.document ? null : undefined } });
    }

    private onRemoved(result: ScanContainerResult): void {
        this.cache.delete(result.container.url, result.document.id);
        this.logger.info(`Removed: AAS ${result.document.idShort} [${result.document.id}] in ${result.container.url}`);
        this.sendMessage({ type: 'Removed', document: { ...result.document, content: null } });
    }

    private onOffline(result: ScanContainerResult): void {
        const reference = this.cache.get(result.container.url, result.document.id);
        reference.content = undefined;
        this.sendMessage({ type: 'Offline', document: { ...result.document, content: undefined } });
    }

    private onContainerAdded(result: ScanEndpointResult): void {
        const url = new URL(result.endpoint);
        const name = getEndpointName(url);
        if (this.endpoints.has(name)) {
            if (this.cache.hasContainer(result.container.url)) {
                this.cache.getContainer(result.container.url).assignTo(url);
            } else {
                const container = this.cache.addNewContainer(result.container, result.endpoint);
                setTimeout(
                    this.startContainerScan.bind(this),
                    this.timeout,
                    this.createTaskId(),
                    container,
                    this.createScanStatistic()
                );
            }

            this.sendMessage({ type: 'ContainerAdded', endpoint: result.endpoint, container: result.container });
        }
    }

    private onContainerRemoved(result: ScanEndpointResult): void {
        if (this.cache.hasContainer(result.container.url)) {
            this.cache.deleteContainer(this.cache.getContainer(result.container.url));
        }

        this.sendMessage({ type: 'ContainerRemoved', endpoint: result.endpoint, container: result.container });
    }

    private sendMessage(data: AASServerMessage) {
        this.wsServer.notify('WorkspaceChanged', {
            type: 'AASServerMessage',
            data: data
        });
    }

    private async getAASDocumentAsync(reference: aas.Key): Promise<AASDocument> {
        const document = await this.selectDocumentAsync((document) => {
            return document.idShort === reference.value || document.id === reference.value;
        });

        if (!document) {
            throw new Error(`An AAS with the identification '${reference.value}' does not exist.`);
        }

        return document;
    }

    private async selectDocumentAsync(func: (document: AASDocument) => boolean): Promise<AASDocument | undefined> {
        return this.cache.find(func);
    }

    private createTaskId(): number {
        const taskId = this.nextTaskId;
        ++this.nextTaskId;
        return taskId;
    }

    private async saveAsync(path: string): Promise<void> {
        const configuration: AASServerConfiguration = {
            endpoints: [...this.endpoints.values()].map(item => item.href)
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