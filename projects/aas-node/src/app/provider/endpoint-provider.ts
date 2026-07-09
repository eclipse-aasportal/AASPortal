/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { LOGGER, Logger } from 'aas-package';
import { LiveRequest, WebSocketData, AASEndpoint, AASEndpointSchedule, convertToString } from 'aas-core';

import { AAS_INDEX, AASIndex } from '../index/aas-index.js';
import { ScanResultKind, ScanResult, ScanEndpointResult, ScanEndpointData, isScanEndpointResult } from '../types.js';
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
            if (isScanEndpointResult(result)) {
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

    private parallelOnEnd = async (result: ScanResult): Promise<void> => {
        const task = this.taskHandler.get(result.taskId);
        if (task === undefined || task.owner !== this) {
            return;
        }

        const endpoint = await this.index.findEndpoint(task.endpointName);
        if (endpoint !== undefined) {
            task.state = 'idle';
            task.end = Date.now();

            this.sender.send({ type: 'End', endpoint: endpoint });

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

        await this.index.update(document);
        this.sender.send({ type: 'Update', document: { ...document, content: null } });
    }

    private async onAdded(result: ScanEndpointResult): Promise<void> {
        const document = result.document;
        const endpoint = await this.index.findEndpoint(document.endpoint);
        if (endpoint === undefined || endpoint.schedule?.type === 'disabled') {
            return;
        }

        await this.index.insert(document);
        this.logger.info(`Added: AAS ${document.idShort} [${document.id}] in ${endpoint.url}`);
        this.sender.send({ type: 'Added', document });
    }

    private async onRemoved(result: ScanEndpointResult): Promise<void> {
        const endpoint = await this.index.findEndpoint(result.endpoint.name);
        if (endpoint === undefined || endpoint.schedule?.type === 'disabled') {
            return;
        }

        const document = result.document;
        await this.index.delete(result.endpoint.name, document.id);
        this.logger.info(`Removed: AAS ${document.idShort} [${document.id}] in ${result.endpoint.url}`);
        this.sender.send({ type: 'Removed', document: { ...document, content: null } });
    }
}
