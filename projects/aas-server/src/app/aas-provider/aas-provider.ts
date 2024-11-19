/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { extname } from 'path/posix';
import { Readable } from 'stream';
import {
    AASDocument,
    LiveRequest,
    WebSocketData,
    AASServerMessage,
    aas,
    selectElement,
    AASCursor,
    AASPagedResult,
    AASEndpoint,
    ApplicationError,
    getChildren,
    isReferenceElement,
    AASEndpointSchedule,
} from 'aas-core';

import { ImageProcessing } from '../image-processing.js';
import { AASIndex } from '../aas-index/aas-index.js';
import { ScanResultKind, ScanResult, ScanEndpointResult } from './scan-result.js';
import { Logger } from '../logging/logger.js';
import { Parallel } from './parallel.js';
import { ScanEndpointData } from './worker-data.js';
import { SocketClient } from '../live/socket-client.js';
import { EmptySubscription } from '../live/empty-subscription.js';
import { SocketSubscription } from '../live/socket-subscription.js';
import { AASResourceFactory } from '../packages/aas-resource-factory.js';
import { Variable } from '../variable.js';
import { WSServer } from '../ws-server.js';
import { ERRORS } from '../errors.js';
import { Task, TaskHandler } from './task-handler.js';
import { HierarchicalStructure } from './hierarchical-structure.js';
import { AASCache } from './aas-cache.js';
import { urlToEndpoint } from '../configuration.js';

@singleton()
export class AASProvider {
    private readonly cache = new AASCache();
    private wsServer!: WSServer;
    private resetRequested = false;

    public constructor(
        @inject(Variable) private readonly variable: Variable,
        @inject('Logger') private readonly logger: Logger,
        @inject(Parallel) private readonly parallel: Parallel,
        @inject(AASResourceFactory) private readonly resourceFactory: AASResourceFactory,
        @inject('AASIndex') private readonly index: AASIndex,
        @inject(TaskHandler) private readonly taskHandler: TaskHandler,
    ) {
        this.parallel.on('message', this.parallelOnMessage);
        this.parallel.on('end', this.parallelOnEnd);
        this.taskHandler.on('empty', this.taskHandlerOnEmpty);
    }

    /**
     * Starts the AAS provider.
     * @param wsServer The web socket server instance.
     */
    public start(wsServer: WSServer): void {
        this.wsServer = wsServer;
        this.wsServer.on('message', this.onClientMessage);
        this.initializeIndex().then(() => setTimeout(this.startScan, 100));
    }

    /**
     * Gets all registered AAS container endpoints.
     */
    public getEndpoints(): Promise<AASEndpoint[]> {
        return this.index.getEndpoints();
    }

    /**
     * Gets the number of registered AAS endpoints.
     */
    public getEndpointCount(): Promise<number> {
        return this.index.getEndpointCount();
    }

    /**
     * Gets a page of documents from the specified cursor.
     * @param cursor The cursor.
     * @param filter A filter expression.
     * @param language The current language.
     * @returns A page of documents.
     */
    public getDocumentsAsync(cursor: AASCursor, filter?: string, language?: string): Promise<AASPagedResult> {
        const minFilterLength = 3;
        if (filter && filter.length >= minFilterLength) {
            return this.index.getDocuments(cursor, filter, language ?? 'en');
        }

        return this.index.getDocuments(cursor);
    }

    /**
     * The total count of AAS documents over all endpoints or a specified endpoint.
     * @param endpoint The endpoint name.
     * @returns The total count of documents.
     */
    public getCountAsync(endpoint?: string): Promise<number> {
        return this.index.getCount(endpoint);
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
     * @param endpointName The endpoint name.
     * @param id The AAS identifier.
     * @returns The AAS environment.
     */
    public async getContentAsync(endpointName: string, id: string): Promise<aas.Environment> {
        const document = await this.index.get(endpointName, id);
        return this.getDocumentContentAsync(document);
    }

    /**
     * Gets the thumbnail of the specified AAS.
     * @param endpointName The endpoint name.
     * @param id The AAS identifier.
     * @returns A readable stream.
     */
    public async getThumbnailAsync(endpointName: string, id: string): Promise<NodeJS.ReadableStream | undefined> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, id);
        const resource = this.resourceFactory.create(endpoint);
        try {
            await resource.openAsync();
            return await resource.createPackage(document.address, document.idShort).getThumbnailAsync(id);
        } finally {
            await resource.closeAsync();
        }
    }

    /**
     * Gets the value of the specified DataElement.
     * @param endpointName The endpoint name.
     * @param id The AAS identifier.
     * @param smId The Submodel identifier.
     * @param path The idShort path.
     * @param options Additional options.
     * @returns A readable stream.
     */
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
            const pkg = resource.createPackage(document.address, document.idShort);
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
                        stream = await ImageProcessing.convertAsync(stream);
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
     * @param endpoint The endpoint to add.
     */
    public async addEndpointAsync(endpoint: AASEndpoint): Promise<void> {
        await this.resourceFactory.testAsync(endpoint);
        await this.index.addEndpoint(endpoint);
        this.wsServer.notify('IndexChange', {
            type: 'AASServerMessage',
            data: {
                type: 'EndpointAdded',
                endpoint: endpoint,
            } as AASServerMessage,
        });

        if (endpoint.schedule?.type === 'manual') {
            return;
        }

        setTimeout(this.scanEndpoint, 0, this.taskHandler.createTask(endpoint.name, this, 'ScanEndpoint'), endpoint);
    }

    /**
     * Updates an existing endpoint.
     * @param endpointName The old endpoint name.
     * @param endpoint The endpoint to update.
     */
    public async updateEndpointAsync(endpoint: AASEndpoint): Promise<void> {
        const old = await this.index.updateEndpoint(endpoint);

        let task = this.taskHandler.find(endpoint.name, 'ScanEndpoint');
        if (task === undefined) {
            task = this.taskHandler.createTask(endpoint.name, this, 'ScanEndpoint');
        }

        if (old.schedule?.type !== endpoint.schedule?.type) {
            if (old.schedule?.type === 'manual') {
                setTimeout(this.scanEndpoint, 0, task, endpoint);
            }
        }
    }

    /**
     * Removes the endpoint with the specified name.
     * @param endpointName The name of the registry to remove.
     */
    public async removeEndpointAsync(endpointName: string): Promise<void> {
        const endpoint = await this.index.getEndpoint(endpointName);
        if (endpoint) {
            await this.index.removeEndpoint(endpoint.name);
            const task = this.taskHandler.find(endpointName, 'ScanEndpoint');
            if (task) {
                this.taskHandler.delete(task.id);
            }

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
        for (const task of [...this.taskHandler.tasks]) {
            if (task.state === 'idle' && task.owner === this) {
                this.taskHandler.delete(task.id);
            }
        }

        this.wsServer.notify('IndexChange', {
            type: 'AASServerMessage',
            data: {
                type: 'Reset',
            } as AASServerMessage,
        });
    }

    /**
     * Updates an Asset Administration Shell.
     * @param endpointName The endpoint name.
     * @param id The AAS identifier.
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
            const pkg = resource.createPackage(document.address, document.idShort);
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
            let env = document.content;
            if (!env) {
                env = await resource.createPackage(document.address, document.idShort).getEnvironmentAsync();
                this.cache.set(document.endpoint, document.id, env);
            }

            return await resource.invoke(env, operation);
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

    /** Starts a scan of the AAS endpoint with the specified name.
     * @param name The name of the endpoint.
     */
    public async startEndpointScan(name: string): Promise<void> {
        const endpoint = await this.index.getEndpoint(name);
        if (endpoint.schedule?.type !== 'manual') {
            throw new Error(`Endpoint ${name} is not configured for the manual start of a scan.`);
        }

        let task = this.taskHandler.find(name, 'ScanEndpoint');
        if (task === undefined) {
            task = this.taskHandler.createTask(endpoint.name, this, 'ScanEndpoint');
        }

        if (task.state === 'inProgress') {
            throw new Error(`Scanning endpoint ${name} is already in progress.`);
        }

        setTimeout(this.scanEndpoint, 0, task, endpoint);
    }

    public destroy(): void {
        this.parallel.off('message', this.parallelOnMessage);
        this.parallel.off('end', this.parallelOnEnd);
        this.taskHandler.off('empty', this.taskHandlerOnEmpty);
    }

    private async restart(): Promise<void> {
        this.resetRequested = false;
        await this.initializeIndex();
        this.cache.clear();
        await this.startScan();
        this.logger.info('AAS Server configuration restored.');
    }

    private async initializeIndex(): Promise<void> {
        if ((await this.index.getEndpointCount()) === 0) {
            for (const endpoint of this.variable.ENDPOINTS.map(endpoint => urlToEndpoint(endpoint))) {
                await this.index.addEndpoint(endpoint);
                this.wsServer.notify('IndexChange', {
                    type: 'AASServerMessage',
                    data: {
                        type: 'EndpointAdded',
                        endpoint: endpoint,
                    } as AASServerMessage,
                });
            }
        }
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
            env = await resource.createPackage(document.address, document.idShort).getEnvironmentAsync();
            this.cache.set(document.endpoint, document.id, env);
        }

        return resource.createSubscription(client, message, env);
    }

    private notify(data: AASServerMessage): void {
        this.wsServer.notify('IndexChange', {
            type: 'AASServerMessage',
            data: data,
        });
    }

    private startScan = async (): Promise<void> => {
        try {
            for (const endpoint of await this.index.getEndpoints()) {
                if (endpoint.schedule?.type === 'manual') {
                    continue;
                }

                const task = this.taskHandler.createTask(endpoint.name, this, 'ScanEndpoint');
                this.taskHandler.set(task);
                setTimeout(this.scanEndpoint, 0, task, endpoint);
            }
        } catch (error) {
            this.logger.error(error);
        }
    };

    private computeTimeout(schedule: AASEndpointSchedule | undefined, start: number, end: number): number {
        if (schedule === undefined) {
            return this.variable.SCAN_ENDPOINT_TIMEOUT;
        }

        start = start || Date.now();
        if (schedule.type === 'every') {
            const values = schedule.values;
            if (values && values.length > 0 && typeof values[0] === 'number') {
                const timeout = end - start - values[0];
                return timeout >= 0 ? timeout : values[0];
            }
        }

        return this.variable.SCAN_ENDPOINT_TIMEOUT;
    }

    private scanEndpoint = async (task: Task, endpoint: AASEndpoint) => {
        const data: ScanEndpointData = {
            type: 'ScanEndpointData',
            taskId: task.id,
            endpoint,
        };

        task.state = 'inProgress';
        task.start = Date.now();
        this.parallel.execute(data);
    };

    private parallelOnMessage = async (result: ScanResult) => {
        try {
            if (this.isScanEndpointResult(result)) {
                switch (result.kind) {
                    case ScanResultKind.Update:
                        await this.onUpdate(result);
                        break;
                    case ScanResultKind.Add:
                        await this.onAdded(result);
                        break;
                    case ScanResultKind.Remove:
                        await this.onRemoved(result);
                        break;
                }
            }
        } catch (error) {
            this.logger.error(error);
        }
    };

    private isScanEndpointResult(result: ScanResult): result is ScanEndpointResult {
        return result.type === 'ScanEndpointResult';
    }

    private parallelOnEnd = async (result: ScanResult) => {
        const task = this.taskHandler.get(result.taskId);
        if (task === undefined || task.owner !== this) {
            return;
        }

        if ((await this.index.hasEndpoint(task.endpointName)) === true) {
            const endpoint = await this.index.getEndpoint(task.endpointName);
            task.state = 'idle';
            task.end = Date.now();

            if (endpoint.schedule?.type === 'once' || endpoint.schedule?.type === 'manual') {
                return;
            }

            setTimeout(this.scanEndpoint, this.computeTimeout(endpoint.schedule, task.start, task.end), task, endpoint);
        }

        if (result.messages) {
            this.logger.start(`scan ${task.endpointName ?? 'undefined'}`);
            result.messages.forEach(message => this.logger.log(message));
            this.logger.stop();
        }

        if (this.resetRequested) {
            this.taskHandler.delete(task.id);
        }
    };

    private async onUpdate(result: ScanEndpointResult): Promise<void> {
        const document = result.document;
        if ((await this.index.hasEndpoint(document.endpoint)) === false) {
            return;
        }

        await this.index.update(document);
        if (document.content && this.cache.has(document.endpoint, document.id)) {
            this.cache.set(document.endpoint, document.id, document.content);
        }

        this.sendMessage({ type: 'Update', document: { ...document, content: null } });
    }

    private async onAdded(result: ScanEndpointResult): Promise<void> {
        if ((await this.index.hasEndpoint(result.document.endpoint)) === false) {
            return;
        }

        await this.index.add(result.document);
        this.logger.info(`Added: AAS ${result.document.idShort} [${result.document.id}] in ${result.endpoint.url}`);
        this.sendMessage({ type: 'Added', document: result.document });
    }

    private async onRemoved(result: ScanEndpointResult): Promise<void> {
        const document = result.document;
        if ((await this.index.hasEndpoint(document.endpoint)) === false) {
            return;
        }

        await this.index.remove(result.endpoint.name, document.id);
        this.cache.remove(document.endpoint, document.id);
        this.logger.info(`Removed: AAS ${document.idShort} [${document.id}] in ${result.endpoint.url}`);
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
            env = await resource.createPackage(document.address, document.idShort).getEnvironmentAsync();
            this.cache.set(document.endpoint, document.id, env);
            return env;
        } finally {
            await resource.closeAsync();
        }
    }

    private readonly taskHandlerOnEmpty = async (owner: object): Promise<void> => {
        if (owner === this && this.resetRequested) {
            await this.restart();
        }
    };
}
