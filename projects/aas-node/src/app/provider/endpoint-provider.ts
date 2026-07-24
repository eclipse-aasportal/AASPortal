/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { LOGGER, Logger } from 'aas-package';
import {
    LiveRequest,
    WebSocketData,
    AASEndpoint,
    AASEndpointSchedule,
    convertToString,
    AASDocument,
    ApplicationError,
    UpdateIndexStatus,
} from 'aas-core';

import { AAS_INDEX, AASIndex } from '../index/aas-index.js';
import { EndpointScanMessage, EndpointScanData, CancelEndpointScanData } from '../types.js';
import { Parallel } from './parallel.js';
import { SocketClient } from '../live/socket-client.js';
import { EmptySubscription } from '../live/empty-subscription.js';
import { SocketSubscription } from '../live/socket-subscription.js';
import { EndpointClientFactory } from '../client/endpoint-client-factory.js';
import { Variable } from '../variable.js';
import { WSNode } from '../ws-node.js';
import { Task, TaskHandler } from './task-handler.js';
import { urlToEndpoint } from '../configuration.js';
import { MessageSender } from './message-sender.js';

@singleton()
export class EndpointProvider {
    private wsServer!: WSNode;
    private sender!: MessageSender;

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
     * Adds a new endpoint.
     * @param endpoint The endpoint to add.
     */
    public async addEndpoint(endpoint: AASEndpoint): Promise<void> {
        await this.clientFactory.testAsync(endpoint, endpoint.headers);
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
        await this.index.updateEndpoint(endpoint);
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

        const newType = endpoint.schedule?.type;
        if (newType === 'manual' || newType === 'disabled') {
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
     * Clears the AAS index.
     * @param endpoint The name of the endpoint to clear. If not specified, all endpoints are cleared.
     */
    public async clearIndex(endpoint?: string): Promise<void> {
        if (endpoint) {
            const task = this.taskHandler.find(endpoint, 'ScanEndpoint');
            if (task) {
                const data: CancelEndpointScanData = {
                    taskId: task.id,
                    type: 'CancelEndpointScanData',
                    endpoint: endpoint,
                };

                await this.parallel.cancel(data);
            }

            await this.index.clear(endpoint);
            await this.startScan(endpoint);
            this.sender.send({ type: 'Cleared', endpoint });
            this.logger.info(`Index of endpoint "${endpoint}" cleared.`);
        } else {
            const endpoints = (await this.index.getEndpoints()).map(endpoint => endpoint.name);
            const promises: Promise<void>[] = [];
            for (const endpoint of endpoints) {
                const task = this.taskHandler.find(endpoint, 'ScanEndpoint');
                if (task) {
                    const data: CancelEndpointScanData = {
                        taskId: task.id,
                        type: 'CancelEndpointScanData',
                        endpoint: endpoint,
                    };

                    promises.push(this.parallel.cancel(data));
                }
            }

            await Promise.all(promises);
            await this.index.clear();
            await this.startScan();
            this.sender.send({ type: 'Cleared' });
            this.logger.info('Index cleared.');
        }
    }

    /**
     * Starts a scan of the AAS endpoint with the specified name.
     * @param name The name of the endpoint.
     */
    public async startEndpointScan(name: string): Promise<void> {
        const endpoint = await this.index.getEndpoint(name);
        if (endpoint.schedule?.type !== 'manual') {
            throw new ApplicationError(
                `Endpoint ${name} is not configured for the manual start of a scan.`,
                { name },
                500,
            );
        }

        let task = this.taskHandler.find(name, 'ScanEndpoint');
        if (task === undefined) {
            task = this.taskHandler.createTask(endpoint.name, this, 'ScanEndpoint');
        }

        if (task.state === 'inProgress') {
            throw new ApplicationError(`Scanning endpoint ${name} is already in progress.`, { name }, 500);
        }

        task.handle = setTimeout(this.scanEndpoint, 0, task, endpoint);
    }

    /**
     * Cancels a scan of the AAS endpoint with the specified name.
     * @param name The name of the endpoint.
     * @returns A promise that resolves when the scan is canceled or if no scan was in progress.
     */
    public async cancelEndpointScan(name: string): Promise<void> {
        const task = this.taskHandler.find(name, 'ScanEndpoint');
        if (task === undefined) {
            return;
        }

        const data: CancelEndpointScanData = {
            taskId: task.id,
            type: 'CancelEndpointScanData',
            endpoint: name,
        };
        await this.parallel.cancel(data);
    }

    public getUpdateStatus(name: string): UpdateIndexStatus {
        const task = this.taskHandler.find(name, 'ScanEndpoint');
        if (task === undefined || task.state === 'idle') {
            return { name, status: 'idle' };
        }

        return { name, status: 'scanning', start: task.start };
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

    private async createSubscription(
        message: LiveRequest,
        socket: SocketClient,
        headers?: Record<string, string>,
    ): Promise<SocketSubscription> {
        const endpoint = await this.index.getEndpoint(message.endpoint);
        const document = await this.index.get(message.endpoint, 'AssetAdministrationShell', message.id);
        const client = this.clientFactory.create(endpoint, headers);
        await client.open();
        const env = await client.getEnvironment(document.address);
        return client.createSubscription(socket, message, env);
    }

    private startScan = async (name?: string): Promise<void> => {
        try {
            for (const endpoint of await this.index.getEndpoints()) {
                if (name && endpoint.name !== name) {
                    continue;
                }

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
        const data: EndpointScanData = {
            type: 'EndpointScanData',
            taskId: task.id,
            endpoint,
        };

        task.state = 'inProgress';
        task.start = Date.now();
        this.parallel.execute(data);
    };

    private parallelOnMessage = async (message: EndpointScanMessage): Promise<void> => {
        try {
            switch (message.kind) {
                case 'Start':
                    this.sender.send({ type: 'Start', endpoint: message.endpoint, start: message.start });
                    break;
                case 'Updated':
                    await this.onUpdate(message.document, message.start);
                    break;
                case 'Added':
                    await this.onAdded(message.document, message.start);
                    break;
                case 'Removed':
                    await this.onRemoved(message.document, message.start);
                    break;
            }
        } catch (error) {
            this.logger.error(error);
        }
    };

    private parallelOnEnd = async (message: EndpointScanMessage): Promise<void> => {
        const task = this.taskHandler.get(message.taskId);
        if (task === undefined || task.owner !== this) {
            return;
        }

        const endpoint = await this.index.findEndpoint(task.name);
        if (endpoint !== undefined) {
            task.state = 'idle';
            task.end = Date.now();
            this.sender.send({ type: 'End', endpoint: endpoint.name, start: message.start });
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

    private async onUpdate(document: AASDocument, start: number): Promise<void> {
        await this.index.update(document);
        this.logger.info(`Updated: AAS ${document.idShort} [${document.id}] in ${document.endpoint}`);
        this.sender.send({ type: 'Updated', document: { ...document, content: null }, start });
    }

    private async onAdded(document: AASDocument, start: number): Promise<void> {
        await this.index.insert(document);
        this.logger.info(`Added: AAS ${document.idShort} [${document.id}] in ${document.endpoint}`);
        this.sender.send({ type: 'Added', document, start });
    }

    private async onRemoved(document: AASDocument, start: number): Promise<void> {
        await this.index.delete(document.endpoint, document.id);
        this.logger.info(`Removed: AAS ${document.idShort} [${document.id}] in ${document.endpoint}`);
        this.sender.send({ type: 'Removed', document: { ...document, content: null }, start });
    }
}
