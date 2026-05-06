/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { LOGGER, Logger } from 'aas-package';
import {
    AASDocument,
    LiveRequest,
    WebSocketData,
    aas,
    AASCursor,
    AASPagedResult,
    AASEndpoint,
    ApplicationError,
    AASEndpointSchedule,
    isFile,
    isBlob,
    convertToString,
    selectReferable,
} from 'aas-core';

import { ImageProcessing } from '../image-processing.js';
import { AAS_INDEX, AASIndex } from '../index/aas-index.js';
import { ScanResultKind, ScanResult, ScanEndpointResult, ScanEndpointData } from '../types.js';
import { Parallel } from './parallel.js';
import { SocketClient } from '../live/socket-client.js';
import { EmptySubscription } from '../live/empty-subscription.js';
import { SocketSubscription } from '../live/socket-subscription.js';
import { EndpointClientFactory } from '../client/endpoint-client-factory.js';
import { Variable } from '../variable.js';
import { WSNode } from '../ws-node.js';
import { ERRORS } from '../errors.js';
import { Task, TaskHandler } from './task-handler.js';
import { urlToEndpoint } from '../configuration.js';
import { createThumbnail } from '../utilities.js';
import { MessageSender } from './message-sender.js';

@singleton()
export class AASProvider {
    private wsServer!: WSNode;
    private sender!: MessageSender;
    private resetRequested = false;

    public constructor(
        @inject(Variable) private readonly variable: Variable,
        @inject(LOGGER) private readonly logger: Logger,
        @inject(Parallel) private readonly parallel: Parallel,
        @inject(EndpointClientFactory) private readonly clientFactory: EndpointClientFactory,
        @inject(AAS_INDEX) private readonly index: AASIndex,
        @inject(TaskHandler) private readonly taskHandler: TaskHandler,
    ) {
        this.parallel.on('message', this.parallelOnMessage);
        this.parallel.on('end', this.parallelOnEnd);
    }

    /**
     * Starts the AAS provider.
     * @param wsServer The web socket server instance.
     */
    public start(wsServer: WSNode): void {
        this.wsServer = wsServer;
        this.sender = new MessageSender(wsServer);
        this.wsServer.on('message', this.onClientMessage);
        this.initializeIndex()
            .then(() => setTimeout(this.startScan, 100))
            .catch(error => this.logger.error(error));
    }

    /**
     * Gets all registered AAS container endpoints.
     * @return An array of registered AAS endpoints.
     */
    public getEndpoints(): Promise<AASEndpoint[]> {
        return this.index.getEndpoints();
    }

    /**
     * Gets the number of registered AAS endpoints.
     * @returns The number of registered AAS endpoints.
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
    public getDocuments(cursor: AASCursor, filter?: string, language?: string): Promise<AASPagedResult> {
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
    public getCount(endpoint?: string): Promise<number> {
        return this.index.getCount(endpoint);
    }

    /**
     * Gets the AAS document with the specified identifier.
     * @param endpoint The AAS endpoint name (optional).
     * @param modelType The model type to which `id` belongs.
     * @param id Depending on the model type the AAS or Asset identifier.
     * @returns The AAS document with the specified identifier.
     */
    public async getDocument(
        endpoint: string | undefined,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Promise<AASDocument> {
        const document = await this.index.find(endpoint, modelType, id);
        if (document) {
            const client = this.clientFactory.create(await this.index.getEndpoint(document.endpoint));
            try {
                await client.open();
                document.content = await client.getEnvironment(document.address);
                if (document.thumbnail === null) {
                    document.thumbnail = await createThumbnail(await client.getThumbnail(document.address));
                }

                return document;
            } finally {
                await client.close();
            }
        }

        if (!endpoint) {
            throw new ApplicationError(ERRORS.AASNotFound, { id }, 404);
        }

        return await this.getDocumentById(endpoint, modelType, id);
    }

    /**
     * Gets the AAS environment for the specified AAS document.
     * @param endpoint The endpoint name.
     * @param id The AAS identifier.
     * @returns The AAS environment.
     */
    public async getContent(endpoint: string, id: string): Promise<aas.Environment> {
        const document = await this.index.get(endpoint, 'AssetAdministrationShell', id);
        const client = this.clientFactory.create(await this.index.getEndpoint(endpoint));
        try {
            await client.open();
            return await client.getEnvironment(document.address);
        } finally {
            await client.close();
        }
    }

    /**
     * Gets the thumbnail of the specified AAS.
     * @param endpointName The endpoint name.
     * @param id The AAS identifier.
     * @returns A readable stream.
     */
    public async getThumbnail(endpointName: string, id: string): Promise<NodeJS.ReadableStream | undefined> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, 'AssetAdministrationShell', id);
        const client = this.clientFactory.create(endpoint);
        try {
            await client.open();
            return await client.getThumbnail(document.address);
        } finally {
            await client.close();
        }
    }

    /**
     * Gets the value of the specified DataElement.
     * @param endpointName The endpoint name.
     * @param id The AAS identifier.
     * @param smId The Submodel identifier.
     * @param idShortPath The idShort path.
     * @param options Additional options.
     * @returns A readable stream.
     */
    public async getDataElementValue(
        endpointName: string,
        id: string,
        smId: string,
        idShortPath: string,
        options?: object,
    ): Promise<NodeJS.ReadableStream> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, 'AssetAdministrationShell', id);
        let stream: NodeJS.ReadableStream;
        const client = this.clientFactory.create(endpoint);
        try {
            await client.open();
            if (!document.content) {
                document.content = await client.getEnvironment(document.address);
            }

            const dataElement: aas.DataElement | undefined = selectReferable(document.content, smId, idShortPath);
            if (!dataElement) {
                throw new Error('DataElement not found.');
            }

            if (isFile(dataElement)) {
                if (!dataElement.value) {
                    throw new Error('Invalid operation.');
                }

                stream = await client.getFile(document.address, dataElement);
                const extension = dataElement.value ? path.extname(dataElement.value).toLowerCase() : '';
                const imageOptions = options as { width?: number; height?: number };
                if (dataElement.contentType.startsWith('image/')) {
                    if (imageOptions?.width || imageOptions?.height) {
                        stream = await ImageProcessing.resizeAsync(stream, imageOptions.width, imageOptions.height);
                    }

                    if (extension === '.tiff' || extension === '.tif') {
                        stream = await ImageProcessing.convertAsync(stream);
                    }
                }
            } else if (isBlob(dataElement)) {
                const value = await client.getBlobValue(smId, idShortPath);
                const readable = new Readable();
                readable.push(value);
                readable.push(null);
                stream = readable;
            } else {
                throw new Error('Not implemented');
            }
        } finally {
            await client.close();
        }

        return stream;
    }

    /**
     * Adds a new endpoint.
     * @param endpoint The endpoint to add.
     */
    public async addEndpoint(endpoint: AASEndpoint): Promise<void> {
        await this.clientFactory.testAsync(endpoint);
        await this.index.insertEndpoint(endpoint);
        this.sender.send({
            type: 'EndpointAdded',
            endpoint: endpoint,
        });

        const type = endpoint.schedule?.type;
        if (type === 'manual' || type === 'disabled') {
            return;
        }

        const task = this.taskHandler.createTask(endpoint.name, this, 'ScanEndpoint');
        task.handle = setTimeout(this.scanEndpoint, 0, task, endpoint);
    }

    /**
     * Updates an existing endpoint.
     * @param endpoint The endpoint to update.
     */
    public async updateEndpoint(endpoint: AASEndpoint): Promise<void> {
        const old = await this.index.updateEndpoint(endpoint);
        this.sender.send({
            type: 'EndpointUpdate',
            endpoint: endpoint,
        });

        let task = this.taskHandler.find(endpoint.name, 'ScanEndpoint');
        if (task) {
            if (task.handle) {
                clearTimeout(task.handle);
                delete task.handle;
            }
        } else {
            task = this.taskHandler.createTask(endpoint.name, this, 'ScanEndpoint');
        }

        const oldType = old.schedule?.type;
        const newType = endpoint.schedule?.type;
        if (oldType !== newType && newType === 'disabled') {
            await this.index.clear(endpoint.name);
            return;
        }

        if (newType === 'manual') {
            return;
        }

        task.handle = setTimeout(this.scanEndpoint, 0, task, endpoint);
    }

    /**
     * Removes the endpoint with the specified name.
     * @param endpointName The name of the registry to remove.
     */
    public async removeEndpoint(endpointName: string): Promise<void> {
        const endpoint = await this.index.getEndpoint(endpointName);
        if (endpoint) {
            await this.index.deleteEndpoint(endpoint.name);
            const task = this.taskHandler.find(endpointName, 'ScanEndpoint');
            if (task) {
                this.taskHandler.delete(task.id);
            }

            this.logger.info(`Endpoint ${endpoint.name} (${endpoint.url}) removed.`);
            this.sender.send({
                type: 'EndpointRemoved',
                endpoint: endpoint,
            });
        }
    }

    /**
     * Restores the default AAS server configuration.
     */
    public async reset(): Promise<void> {
        if (this.resetRequested) {
            return;
        }

        this.resetRequested = true;
        await this.parallel.terminate();
        await this.index.clear();
        await this.initializeIndex();
        await this.startScan();
        this.resetRequested = false;
        this.sender.send({ type: 'Reset' });
        this.logger.info('AASNode index reset.');
    }

    /**
     * Updates the content of an AAS document.
     * @param endpointName The endpoint name.
     * @param id The unique AAS identifier.
     * @param content The modified elements of the document content.
     */
    public async updateDocument(endpointName: string, id: string, content: aas.Environment): Promise<void> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, 'AssetAdministrationShell', id);
        if (!document) {
            throw new Error(`The destination document ${id} is not available.`);
        }

        const client = this.clientFactory.create(endpoint);
        try {
            await client.open();
            await client.setEnvironment(document.address, content);
        } finally {
            await client.close();
        }
    }

    /**
     * Downloads an AASX package.
     * @param endpointName The endpoint name.
     * @param id The AAS identifier.
     * @returns A readable stream.
     */
    public async getPackage(endpointName: string, id: string): Promise<NodeJS.ReadableStream> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, 'AssetAdministrationShell', id);
        const client = this.clientFactory.create(endpoint);
        try {
            await client.open();
            return await client.getPackage(id, document.address);
        } finally {
            await client.close();
        }
    }

    /**
     * Inserts an AASX package file into the AAS endpoint identified by the given name.
     *
     * @param endpointName - The name of the AAS endpoint to which the package should be uploaded.
     * @param file - The file object provided by Express/Multer containing the package data to insert.
     *
     * @returns A promise that resolves when the insert operation completes successfully.
     *
     * @throws {ApplicationError} If no endpoint with the specified name exists. The error uses
     *   ERRORS.EndpointDoesNotExist and includes the provided endpointName as context.
     * @throws {Error} If opening the client, inserting the package, or closing the client fails.
     *
     * @remarks
     * - The client is always closed in a finally block to avoid leaving open connections,
     *   even if an error occurs during open or insert.
     * - Caller is responsible for ensuring the Multer file contains valid package content
     *   as expected by the underlying client's insertPackage implementation.
     */
    public async insertPackages(endpointName: string, file: Express.Multer.File): Promise<void> {
        const endpoint = await this.index.getEndpoint(endpointName);
        if (!endpoint) {
            throw new ApplicationError(ERRORS.EndpointDoesNotExist, { endpoint: endpointName }, 404);
        }

        const client = this.clientFactory.create(endpoint);
        try {
            await client.open();
            const aasxFile = path.join(path.dirname(file.path), file.originalname);
            if (fs.existsSync(aasxFile)) {
                await fs.promises.unlink(aasxFile);
            }

            await fs.promises.rename(file.path, aasxFile);
            await client.insertPackage(aasxFile);
            const address = await client.determineAddress(aasxFile);
            if (address) {
                const document = await client.createDocument(address);
                await this.index.insert(document);
                this.sender.send({ type: 'Added', document });
            }
        } finally {
            await client.close();
        }
    }

    /**
     * Deletes an AASX package from an endpoint.
     * @param endpointName The endpoint name.
     * @param id The AAS identification.
     */
    public async deletePackage(endpointName: string, id: string): Promise<void> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, 'AssetAdministrationShell', id);
        if (document) {
            const client = this.clientFactory.create(endpoint);
            try {
                await client.deletePackage(document.id, document.address);
                await this.index.delete(endpointName, id);
                this.sender.send({ type: 'Removed', document: { ...document, content: null } });
            } finally {
                await client.close();
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
        const document = await this.index.get(endpointName, 'AssetAdministrationShell', id);
        const client = this.clientFactory.create(endpoint);
        try {
            await client.open();
            let env = document.content;
            if (!env) {
                env = await client.getEnvironment(document.address);
            }

            return await client.invoke(operation);
        } finally {
            await client.close();
        }
    }

    /**
     * Starts a scan of the AAS endpoint with the specified name.
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

        task.handle = setTimeout(this.scanEndpoint, 0, task, endpoint);
    }

    public destroy(): void {
        this.parallel.off('message', this.parallelOnMessage);
        this.parallel.off('end', this.parallelOnEnd);
        this.sender.destroy();
    }

    private async initializeIndex(): Promise<void> {
        if ((await this.index.getEndpointCount()) > 0) {
            return;
        }

        for (const endpoint of this.variable.ENDPOINTS.map(endpoint => urlToEndpoint(endpoint))) {
            try {
                await this.index.insertEndpoint(endpoint);
                this.logger.info(`Endpoint ${endpoint.name} (${endpoint.url}) added.`);
                this.sender.send({
                    type: 'EndpointAdded',
                    endpoint: endpoint,
                });
            } catch (error) {
                this.logger.error(
                    `Adding endpoint ${endpoint.name} (${endpoint.url}) failed: ${convertToString(error)}`,
                );
            }
        }
    }

    private onClientMessage = async (data: WebSocketData, socket: SocketClient): Promise<void> => {
        try {
            switch (data.type) {
                case 'LiveRequest':
                    socket.subscribe(data.type, await this.createSubscription(data.data as LiveRequest, socket));
                    break;
                case 'IndexChange':
                    socket.subscribe(data.type, new EmptySubscription());
                    break;
                default:
                    throw new Error(`'${data.type}' is an unsupported Websocket message type.`);
            }
        } catch (error) {
            this.logger.error(error);
        }
    };

    private async createSubscription(message: LiveRequest, socket: SocketClient): Promise<SocketSubscription> {
        const endpoint = await this.index.getEndpoint(message.endpoint);
        const document = await this.index.get(message.endpoint, 'AssetAdministrationShell', message.id);
        const client = this.clientFactory.create(endpoint);
        await client.open();
        const env = await client.getEnvironment(document.address);
        return client.createSubscription(socket, message, env);
    }

    private startScan = async (): Promise<void> => {
        try {
            for (const endpoint of await this.index.getEndpoints()) {
                const type = endpoint.schedule?.type;
                if (type === 'manual' || type === 'disabled') {
                    continue;
                }

                let task = this.taskHandler.find(endpoint.name, 'ScanEndpoint');
                if (task === undefined) {
                    task = this.taskHandler.createTask(endpoint.name, this, 'ScanEndpoint');
                }

                task.handle = setTimeout(this.scanEndpoint, 0, task, endpoint);
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
                const timeout = values[0] - (end - start);
                return timeout >= 0 ? timeout : values[0];
            }
        }

        return this.variable.SCAN_ENDPOINT_TIMEOUT;
    }

    private scanEndpoint = (task: Task, endpoint: AASEndpoint): void => {
        const data: ScanEndpointData = {
            type: 'ScanEndpointData',
            taskId: task.id,
            endpoint,
        };

        task.state = 'inProgress';
        task.start = Date.now();
        this.parallel.execute(data);
    };

    private parallelOnMessage = async (result: ScanResult): Promise<void> => {
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

    private parallelOnEnd = async (result: ScanResult): Promise<void> => {
        const task = this.taskHandler.get(result.taskId);
        if (task === undefined || task.owner !== this) {
            return;
        }

        const endpoint = await this.index.findEndpoint(task.endpointName);
        if (endpoint !== undefined) {
            task.state = 'idle';
            task.end = Date.now();

            const type = endpoint.schedule?.type;
            if (type === 'once' || type === 'manual' || type === 'disabled') {
                return;
            }

            task.handle = setTimeout(
                this.scanEndpoint,
                this.computeTimeout(endpoint.schedule, task.start, task.end),
                task,
                endpoint,
            );
        }
    };

    private async onUpdate(result: ScanEndpointResult): Promise<void> {
        const document = result.document;
        const endpoint = await this.index.findEndpoint(document.endpoint);
        if (endpoint === undefined || endpoint.schedule?.type === 'disabled') {
            return;
        }

        try {
            await this.index.update(document);
            this.sender.send({ type: 'Update', document: { ...document, content: null } });
        } catch (error) {
            this.logger.error(error);
        }
    }

    private async onAdded(result: ScanEndpointResult): Promise<void> {
        const document = result.document;
        const endpoint = await this.index.findEndpoint(document.endpoint);
        if (endpoint === undefined || endpoint.schedule?.type === 'disabled') {
            return;
        }

        try {
            await this.index.insert(document);
            this.logger.info(`Added: AAS ${document.idShort} [${document.id}] in ${endpoint.url}`);
            this.sender.send({ type: 'Added', document });
        } catch (error) {
            this.logger.error(error);
        }
    }

    private async onRemoved(result: ScanEndpointResult): Promise<void> {
        const endpoint = await this.index.findEndpoint(result.endpoint.name);
        if (endpoint === undefined || endpoint.schedule?.type === 'disabled') {
            return;
        }

        const document = result.document;
        try {
            await this.index.delete(result.endpoint.name, document.id);
            this.logger.info(`Removed: AAS ${document.idShort} [${document.id}] in ${result.endpoint.url}`);
            this.sender.send({ type: 'Removed', document: { ...document, content: null } });
        } catch (error) {
            this.logger.error(error);
        }
    }

    private async getDocumentById(
        endpoint: string,
        modelType: 'Asset' | 'AssetAdministrationShell',
        id: string,
    ): Promise<AASDocument> {
        const client = this.clientFactory.create(await this.index.getEndpoint(endpoint));
        try {
            await client.open();
            let address: string | undefined;
            if (modelType === 'AssetAdministrationShell') {
                address = id;
            } else {
                address = (await client.getAllAssetAdministrationShellIdsByAssetLink(id)).at(0);
                if (!address) {
                    throw new ApplicationError(ERRORS.AASNotFoundByAssetLink, { assetId: id }, 404);
                }
            }

            return await client.createDocument(address);
        } finally {
            await client.close();
        }
    }
}
