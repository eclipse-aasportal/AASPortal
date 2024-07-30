/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { extname } from 'path/posix';
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
    isReferenceElement,
} from 'aas-core';

import { ImageProcessing } from '../image-processing.js';
import { AASIndex } from '../aas-index/aas-index.js';
import { ScanResultType, ScanResult, ScanContainerResult } from './scan-result.js';
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
import { TaskHandler } from './task-handler.js';
import { HierarchicalStructure } from './hierarchical-structure.js';
import { AASCache } from './aas-cache.js';

@singleton()
export class AASProvider {
    private readonly timeout: number;
    private readonly file: string | undefined;
    private readonly cache = new AASCache();
    private wsServer!: WSServer;
    private resetRequested = false;

    public constructor(
        @inject(Variable) variable: Variable,
        @inject('Logger') private readonly logger: Logger,
        @inject(Parallel) private readonly parallel: Parallel,
        @inject(AASResourceFactory) private readonly resourceFactory: AASResourceFactory,
        @inject('AASIndex') private readonly index: AASIndex,
        @inject(TaskHandler) private readonly taskHandler: TaskHandler,
    ) {
        this.timeout = variable.SCAN_CONTAINER_TIMEOUT;
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

    /**
     * Gets all registered AAS container endpoints.
     */
    public getEndpoints(): Promise<AASEndpoint[]> {
        return this.index.getEndpoints();
    }

    /**
     * Gets a page of documents from the specified cursor.
     * @param cursor The cursor.
     * @param filter A filter expression.
     * @param language The current language.
     * @returns A page of documents.
     */
    public getDocumentsAsync(cursor: AASCursor, filter?: string, language?: string): Promise<AASPage> {
        const minFilterLength = 3;
        if (filter && filter.length >= minFilterLength) {
            return this.index.getDocuments(cursor, filter, language ?? 'en');
        }

        return this.index.getDocuments(cursor);
    }

    /**
     * The total count of AAS documents.
     * @param filter A filter expression.
     * @returns The total count of documents.
     */
    public getDocumentCountAsync(filter?: string): Promise<number> {
        return this.index.getCount(filter);
    }

    /**
     * Gets the AAS document with the specified identifier.
     * @param id The AAS identifier.
     * @param endpointName The endpoint name.
     * @returns The AAS document with the specified identifier.
     */
    public async getDocumentAsync(id: string, endpointName?: string): Promise<AASDocument> {
        const document = await this.index.get(endpointName, id);
        document.content = await this.getDocumentContentAsync(document);
        return document;
    }

    /**
     * Gets the AAS environment for the specified AAS document.
     * @param endpointName
     * @param id
     * @returns
     */
    public async getContentAsync(endpointName: string, id: string): Promise<aas.Environment> {
        const document = await this.index.get(endpointName, id);
        return this.getDocumentContentAsync(document);
    }

    public async getThumbnailAsync(endpointName: string, id: string): Promise<NodeJS.ReadableStream | undefined> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, id);
        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            return await resource.createPackage(document.address).getThumbnailAsync(id);
        } finally {
            await resource.closeAsync();
        }
    }

    public async getDataElementValueAsync(
        endpointName: string,
        id: string,
        smId: string,
        path: string,
        options?: object,
    ): Promise<NodeJS.ReadableStream> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, id);
        let stream: NodeJS.ReadableStream;
        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            const pkg = resource.createPackage(document.address);
            if (!document.content) {
                document.content = this.cache.get(document.endpoint, document.id);
                if (!document.content) {
                    document.content = await pkg.getEnvironmentAsync();
                    this.cache.set(document.endpoint, document.id, document.content);
                }
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
                readable.push(JSON.stringify({ value }));
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
     * @param endpointName The endpoint name.
     * @param url The endpoint URL.
     */
    public async addEndpointAsync(endpointName: string, endpoint: AASEndpoint): Promise<void> {
        if (endpointName !== endpoint.name) {
            throw new Error('Invalid operation.');
        }

        await this.resourceFactory.testAsync(endpoint);
        await this.index.addEndpoint(endpoint);
        this.wsServer.notify('IndexChange', {
            type: 'AASServerMessage',
            data: {
                type: 'EndpointAdded',
                endpoint: endpoint,
            } as AASServerMessage,
        });

        setTimeout(this.scanContainer, 0, this.taskHandler.createTaskId(), endpoint);
    }

    /**
     * Removes the endpoint with the specified name.
     * @param endpointName The name of the registry to remove.
     */
    public async removeEndpointAsync(endpointName: string): Promise<void> {
        const endpoint = await this.index.getEndpoint(endpointName);
        if (endpoint) {
            await this.index.removeEndpoint(endpoint.name);
            this.logger.info(`Endpoint ${endpoint.name} (${endpoint.url}) removed.`);
            this.wsServer.notify('IndexChange', {
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
        if (this.resetRequested) {
            return;
        }

        this.resetRequested = true;
        await this.index.clear();
        this.cache.clear();
        this.wsServer.notify('IndexChange', {
            type: 'AASServerMessage',
            data: {
                type: 'Reset',
            } as AASServerMessage,
        });

        if (this.taskHandler.empty(this)) {
            await this.restart();
        }
    }

    /**
     * Updates an Asset Administration Shell.
     * @param endpointName The endpoint name.
     * @param id The AAS document ID.
     * @param content The new document content.
     * @returns
     */
    public async updateDocumentAsync(endpointName: string, id: string, content: aas.Environment): Promise<string[]> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, id);
        if (!document) {
            throw new Error(`The destination document ${id} is not available.`);
        }

        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            const pkg = resource.createPackage(document.address);
            if (!document.content) {
                document.content = await pkg.getEnvironmentAsync();
                if (this.cache.has(document.endpoint, document.id)) {
                    this.cache.set(document.endpoint, document.id, document.content);
                }
            }

            return await pkg.setEnvironmentAsync(content, document.content);
        } finally {
            await resource.closeAsync();
        }
    }

    /**
     * Downloads an AASX package.
     * @param endpointName The endpoint name.
     * @param id The AAS identifier.
     * @returns A readable stream.
     */
    public async getPackageAsync(endpointName: string, id: string): Promise<NodeJS.ReadableStream> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, id);
        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            return await resource.getPackageAsync(id, document.address);
        } finally {
            await resource.closeAsync();
        }
    }

    /**
     * Uploads one or more AASX packages.
     * @param endpointName The name of the destination endpoint.
     * @param files A list of AASX package files.
     */
    public async addPackagesAsync(endpointName: string, files: Express.Multer.File[]): Promise<void> {
        const endpoint = await this.index.getEndpoint(endpointName);
        if (!endpoint) {
            throw new ApplicationError(
                `An AAS container with the name "${endpointName}" does not exist.`,
                ERRORS.ContainerDoesNotExist,
                endpointName,
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
     * @param endpointName The endpoint name.
     * @param id The AAS identification.
     */
    public async deletePackageAsync(endpointName: string, id: string): Promise<void> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, id);
        if (document) {
            const resource = this.resourceFactory.create(endpoint);
            try {
                await resource.deletePackageAsync(document.id, document.address);
                await this.index.remove(endpointName, id);
                this.notify({ type: 'Removed', document: { ...document, content: null } });
            } finally {
                await resource.closeAsync();
            }
        }
    }

    /** Only used for test. */
    public async scanAsync(factory: AASResourceScanFactory): Promise<void> {
        for (const endpoint of await this.index.getEndpoints()) {
            if (endpoint.type === 'FileSystem') {
                const documents = await factory.create(endpoint).scanAsync();
                documents.forEach(async document => await this.index.add(document));
            }
        }
    }

    /**
     * Invokes an operation synchronous.
     * @param endpointName The endpoint name.
     * @param id The AAS identifier.
     * @param operation The Operation element.
     * @returns ToDo.
     */
    public async invoke(endpointName: string, id: string, operation: aas.Operation): Promise<aas.Operation> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, id);
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
     * @param endpointName The endpoint name.
     * @param id The AAS identifier.
     * @returns
     */
    public async getHierarchyAsync(endpointName: string, id: string): Promise<AASDocument[]> {
        const document = await this.index.get(endpointName, id);
        const root: AASDocument = { ...document, parentId: null, content: null };
        const nodes: AASDocument[] = [root];
        await this.collectDescendants(root, nodes);
        return nodes;
    }

    private async restart(): Promise<void> {
        this.resetRequested = false;
        await this.index.reset();
        this.cache.clear();
        await this.startScan();
        this.logger.info('AAS Server configuration restored.');
    }

    private onClientMessage = async (data: WebSocketData, client: SocketClient): Promise<void> => {
        try {
            switch (data.type) {
                case 'LiveRequest':
                    client.subscribe(data.type, await this.createSubscription(data.data as LiveRequest, client));
                    break;
                case 'IndexChange':
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
        let env = this.cache.get(document.endpoint, document.id);
        if (!env) {
            env = await resource.createPackage(document.address).getEnvironmentAsync();
            this.cache.set(document.endpoint, document.id, env);
        }

        return resource.createSubscription(client, message, env);
    }

    private startScan = async (): Promise<void> => {
        try {
            for (const endpoint of await this.index.getEndpoints()) {
                setTimeout(this.scanContainer, 0, this.taskHandler.createTaskId(), endpoint);
            }
        } catch (error) {
            this.logger.error(error);
        }
    };

    private scanContainer = async (taskId: number, endpoint: AASEndpoint) => {
        const documents = await this.index.getContainerDocuments(endpoint.name);
        const data: ScanContainerData = {
            type: 'ScanContainerData',
            taskId,
            container: { ...endpoint, documents },
        };

        this.taskHandler.set(taskId, { name: endpoint.name, owner: this, type: 'ScanContainer' });
        this.parallel.execute(data);
    };

    private notify(data: AASServerMessage): void {
        this.wsServer.notify('IndexChange', {
            type: 'AASServerMessage',
            data: data,
        });
    }

    private parallelOnEnd = async (result: ScanResult) => {
        const task = this.taskHandler.get(result.taskId);
        if (!task || task.owner !== this) {
            return;
        }

        this.taskHandler.delete(result.taskId);
        if ((await await this.index.hasEndpoint(task.name)) === true) {
            const endpoint = await this.index.getEndpoint(task.name);
            setTimeout(this.scanContainer, this.timeout, result.taskId, endpoint);
        }

        if (result.messages) {
            this.logger.start(`scan ${task.name ?? 'undefined'}`);
            result.messages.forEach(message => this.logger.log(message));
            this.logger.stop();
        }

        if (this.resetRequested && this.taskHandler.empty(this)) {
            await this.restart();
        }
    };

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
        const document = result.document;
        if ((await this.index.hasEndpoint(document.endpoint)) === false) return;

        await this.index.update(document);
        if (document.content && this.cache.has(document.endpoint, document.id)) {
            this.cache.set(document.endpoint, document.id, document.content);
        }

        this.sendMessage({ type: 'Changed', document: { ...document, content: null } });
    }

    private async onAdded(result: ScanContainerResult): Promise<void> {
        if ((await this.index.hasEndpoint(result.document.endpoint)) === false) return;

        await this.index.add(result.document);
        this.logger.info(`Added: AAS ${result.document.idShort} [${result.document.id}] in ${result.container.url}`);
        this.sendMessage({ type: 'Added', document: result.document });
    }

    private async onRemoved(result: ScanContainerResult): Promise<void> {
        const document = result.document;
        if ((await this.index.hasEndpoint(document.endpoint)) === false) return;

        await this.index.remove(result.container.name, document.id);
        this.cache.remove(document.endpoint, document.id);
        this.logger.info(`Removed: AAS ${document.idShort} [${document.id}] in ${result.container.url}`);
        this.sendMessage({ type: 'Removed', document: { ...document, content: null } });
    }

    private sendMessage(data: AASServerMessage) {
        this.wsServer.notify('IndexChange', {
            type: 'AASServerMessage',
            data: data,
        });
    }

    private async collectDescendants(parent: AASDocument, nodes: AASDocument[]): Promise<void> {
        const content = parent.content ?? (await this.getDocumentContentAsync(parent));
        for (const submodel of this.whereHierarchicalStructure(content.submodels)) {
            const assetIds = await new HierarchicalStructure(parent, content, submodel).getChildren();
            for (const assetId of assetIds) {
                const child = await this.index.find(undefined, assetId);
                if (child) {
                    const node: AASDocument = { ...child, parentId: parent.id, content: null };
                    nodes.push(node);
                    await this.collectDescendants(node, nodes);
                }
            }
        }

        for (const reference of this.whereAASReference(content.submodels)) {
            const childId = reference.keys[0].value;
            const child =
                (await this.index.find(parent.endpoint, childId)) ?? (await this.index.find(undefined, childId));

            if (child) {
                const node: AASDocument = { ...child, parentId: parent.id, content: null };
                nodes.push(node);
                await this.collectDescendants(node, nodes);
            }
        }
    }

    private *whereHierarchicalStructure(submodels: aas.Submodel[]): Generator<aas.Submodel> {
        for (const submodel of submodels) {
            if (HierarchicalStructure.isHierarchicalStructure(submodel)) {
                yield submodel;
            }
        }
    }

    private *whereAASReference(elements: aas.Referable[]): Generator<aas.Reference> {
        const stack: aas.Referable[][] = [];
        stack.push(elements);
        while (stack.length > 0) {
            const children = stack.pop() as aas.Referable[];
            for (const child of children) {
                if (isReferenceElement(child)) {
                    if (child.value && child.value.keys.some(item => item.type === 'AssetAdministrationShell')) {
                        yield child.value;
                    }
                }

                const children = getChildren(child);
                if (children.length > 0) {
                    stack.push(children);
                }
            }
        }
    }

    private async getDocumentContentAsync(document: AASDocument): Promise<aas.Environment> {
        let env = this.cache.get(document.endpoint, document.id);
        if (env) {
            return env;
        }

        const endpoint = await this.index.getEndpoint(document.endpoint);
        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            env = await resource.createPackage(document.address).getEnvironmentAsync();
            this.cache.set(document.endpoint, document.id, env);
            return env;
        } finally {
            await resource.closeAsync();
        }
    }
}
