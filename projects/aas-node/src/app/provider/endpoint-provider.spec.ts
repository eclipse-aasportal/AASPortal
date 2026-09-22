/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, afterEach, it, expect, Mocked, vi } from 'vitest';
import { AASEndpoint } from 'aas-core';
import { CommandData, LOGGER, Logger } from 'aas-package';

import { EndpointClientFactory } from '../client/endpoint-client-factory.js';
import { createSpyObj } from '../../test/mocks.js';
import { EndpointProvider } from './endpoint-provider.js';
import { EndpointScanWorkerPool } from '../scan/endpoint-scan-worker-pool.js';
import { TaskHandler } from './task-handler.js';
import { Variable } from '../variable.js';
import { AASIndexClient } from '../index/aas-index-client.js';
import { container } from 'tsyringe';
import { AAS_INDEX } from '../index/aas-index.js';
import { WSNode } from '../ws-node.js';

describe('EndpointController', () => {
    let provider: EndpointProvider;
    let index: Mocked<AASIndexClient>;
    let logger: Mocked<Logger>;
    let workerPool: Mocked<EndpointScanWorkerPool>;
    let clientFactory: Mocked<EndpointClientFactory>;
    let variable: Mocked<Variable>;
    let wsServer: Mocked<WSNode>;
    let taskHandler: TaskHandler;

    const endpoint: AASEndpoint = {
        name: 'Samples',
        url: 'file:///assets/samples',
        type: 'FileSystem',
    };

    beforeEach(async () => {
        vi.useFakeTimers();

        logger = createSpyObj<Logger>(['info', 'error']);
        workerPool = createSpyObj<EndpointScanWorkerPool>(['on', 'off', 'execute', 'cancel', 'dispose']);
        workerPool.dispose.mockResolvedValue();

        clientFactory = createSpyObj<EndpointClientFactory>(['create', 'testAsync']);
        clientFactory.testAsync.mockResolvedValue();

        index = createSpyObj<AASIndexClient>([
            'insertEndpoint',
            'updateEndpoint',
            'clear',
            'getEndpoint',
            'findEndpoint',
            'getEndpoints',
            'getEndpointCount',
            'getDocumentCount',
            'deleteEndpoint',
        ]);

        index.clear.mockResolvedValue();
        index.getEndpoints.mockResolvedValue([]);
        index.getEndpointCount.mockResolvedValue(1);

        variable = createSpyObj<Variable>([], {
            ENDPOINTS: [],
            SCAN_ENDPOINT_TIMEOUT: 1000,
        });

        taskHandler = new TaskHandler();
        wsServer = createSpyObj<WSNode>(['notify', 'send']);

        container.clearInstances();
        container.registerInstance(Variable, variable);
        container.registerInstance(LOGGER, logger);
        container.registerInstance(EndpointScanWorkerPool, workerPool);
        container.registerInstance(EndpointClientFactory, clientFactory);
        container.registerInstance(AAS_INDEX, index);
        container.registerInstance(TaskHandler, taskHandler);
        container.registerSingleton(EndpointProvider);
        container.registerInstance(WSNode, wsServer);

        provider = container.resolve(EndpointProvider);
        await provider.start();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('getEndpointCount', () => {
        it('returns the number of endpoints', async () => {
            index.getEndpoints.mockResolvedValue([endpoint]);
            const count = await provider.getEndpointCount();
            expect(count).toBe(1);
        });
    });

    describe('getEndpoints', () => {
        it('returns all current available endpoints', async () => {
            index.getEndpoints.mockResolvedValue([endpoint]);
            const endpoints = await provider.getEndpoints();
            expect(endpoints).toEqual([endpoint]);
        });
    });

    describe('getDocumentCount', () => {
        it('returns the total number of AAS documents', async () => {
            index.getDocumentCount.mockResolvedValue(5);
            const count = await provider.getDocumentCount();
            expect(count).toBe(5);
        });
    });

    describe('getEndpointDocumentCount', () => {
        it('returns the number of documents for the specified AAS endpoint', async () => {
            index.getDocumentCount.mockResolvedValue(3);
            const count = await provider.getEndpointDocumentCount('endpointName');
            expect(count).toBe(3);
        });
    });

    describe('addEndpoint', () => {
        it('adds endpoint and schedules scan for non-manual endpoints', async () => {
            const configuredEndpoint: AASEndpoint = {
                ...endpoint,
                schedule: { type: 'every', values: [2000] },
            };

            await provider.addEndpoint(configuredEndpoint);

            expect(clientFactory.testAsync).toHaveBeenCalledWith(configuredEndpoint, undefined);
            expect(index.insertEndpoint).toHaveBeenCalledWith(configuredEndpoint);
            expect(wsServer.send).toHaveBeenCalledWith({
                type: 'EndpointAdded',
                endpoint: configuredEndpoint,
            });

            const task = taskHandler.find(configuredEndpoint.name, 'ScanEndpoint');
            expect(task).toBeDefined();

            vi.runOnlyPendingTimers();

            expect(workerPool.execute).toHaveBeenCalledWith({
                type: 'command',
                name: 'ScanEndpoint',
                args: { endpoint: configuredEndpoint, taskId: task?.id },
            } satisfies CommandData);
        });

        it('does not schedule scan for manual endpoints', async () => {
            const manualEndpoint: AASEndpoint = {
                ...endpoint,
                schedule: { type: 'manual' },
            };

            await provider.addEndpoint(manualEndpoint);

            expect(taskHandler.find(manualEndpoint.name, 'ScanEndpoint')).toBeUndefined();
            expect(workerPool.execute).not.toHaveBeenCalled();
        });
    });

    describe('updateEndpoint', () => {
        it('clears endpoint content when schedule changed to disabled', async () => {
            const oldEndpoint: AASEndpoint = {
                ...endpoint,
                schedule: { type: 'every', values: [1000] },
            };

            const disabledEndpoint: AASEndpoint = {
                ...endpoint,
                schedule: { type: 'disabled' },
            };

            index.updateEndpoint.mockResolvedValue(oldEndpoint);
            await provider.updateEndpoint(disabledEndpoint);
            vi.runOnlyPendingTimers();
            expect(workerPool.execute).not.toHaveBeenCalled();
        });

        it('schedules a scan for non-manual and non-disabled endpoints', async () => {
            const oldEndpoint: AASEndpoint = {
                ...endpoint,
                schedule: { type: 'manual' },
            };

            const recurringEndpoint: AASEndpoint = {
                ...endpoint,
                schedule: { type: 'every', values: [1000] },
            };

            index.updateEndpoint.mockResolvedValue(oldEndpoint);

            await provider.updateEndpoint(recurringEndpoint);

            const task = taskHandler.find(recurringEndpoint.name, 'ScanEndpoint');
            expect(task).toBeDefined();

            vi.runOnlyPendingTimers();

            expect(workerPool.execute).toHaveBeenCalledWith({
                type: 'command',
                name: 'ScanEndpoint',
                args: { endpoint: recurringEndpoint, taskId: task?.id },
            } satisfies CommandData);
        });
    });

    describe('removeEndpoint', () => {
        it('removes endpoint, clears task and sends notification', async () => {
            index.getEndpoint.mockResolvedValue(endpoint);
            index.deleteEndpoint.mockResolvedValue(true);
            const task = taskHandler.createTask(endpoint.name, provider, 'ScanEndpoint');
            const deleteTaskSpy = vi.spyOn(taskHandler, 'delete');

            await provider.removeEndpoint(endpoint.name);

            expect(index.deleteEndpoint).toHaveBeenCalledWith(endpoint.name);
            expect(deleteTaskSpy).toHaveBeenCalledWith(task.id);
            expect(wsServer.send).toHaveBeenCalledWith({
                type: 'EndpointRemoved',
                endpoint,
            });
        });
    });

    describe('startEndpointScan', () => {
        it('throws if endpoint is not configured for manual scans', async () => {
            index.getEndpoint.mockResolvedValue({
                ...endpoint,
                schedule: { type: 'every', values: [1000] },
            });

            await expect(provider.startEndpointScan(endpoint.name)).rejects.toThrow(
                `Endpoint ${endpoint.name} is not configured for the manual start of a scan.`,
            );
        });

        it('throws if manual scan is already in progress', async () => {
            index.getEndpoint.mockResolvedValue({
                ...endpoint,
                schedule: { type: 'manual' },
            });

            const task = taskHandler.createTask(endpoint.name, provider, 'ScanEndpoint');
            task.state = 'inProgress';

            await expect(provider.startEndpointScan(endpoint.name)).rejects.toThrow(
                `Scanning endpoint ${endpoint.name} is already in progress.`,
            );
        });

        it('starts a manual scan when endpoint is idle', async () => {
            index.getEndpoint.mockResolvedValue({
                ...endpoint,
                schedule: { type: 'manual' },
            });

            await provider.startEndpointScan(endpoint.name);

            const task = taskHandler.find(endpoint.name, 'ScanEndpoint');
            expect(task).toBeDefined();

            vi.runOnlyPendingTimers();

            expect(workerPool.execute).toHaveBeenCalledWith({
                type: 'command',
                name: 'ScanEndpoint',
                args: { endpoint: { ...endpoint, schedule: { type: 'manual' } }, taskId: task?.id },
            } satisfies CommandData);
        });
    });

    describe('cancelEndpointScan', () => {
        it('cancels an ongoing scan', async () => {
            index.getEndpoint.mockResolvedValue({
                ...endpoint,
                schedule: { type: 'manual' },
            });

            const task = taskHandler.createTask(endpoint.name, provider, 'ScanEndpoint');
            task.state = 'inProgress';

            await provider.cancelEndpointScan(endpoint.name);
            expect(workerPool.cancel).toHaveBeenCalledWith(task.id, endpoint.name);
        });
    });

    describe('clear', () => {
        it('clears all endpoints when no endpoint name is provided', async () => {
            await provider.clearIndex();

            expect(index.clear).toHaveBeenCalled();
            expect(wsServer.send).toHaveBeenCalledWith({
                type: 'Cleared',
            });
        });

        it('clears a specific endpoint when an endpoint name is provided', async () => {
            await provider.clearIndex(endpoint.name);

            expect(index.clear).toHaveBeenCalledWith(endpoint.name);
            expect(wsServer.send).toHaveBeenCalledWith({
                type: 'Cleared',
                endpoint: endpoint.name,
            });
        });
    });

    describe('getEndpointStatus', () => {
        it('should return idle status of an endpoint', () => {
            const status = provider.getUpdateStatus('TestEndpoint');
            expect(status).toEqual({ name: 'TestEndpoint', status: 'idle' });
        });

        it('should return scanning status of an endpoint', () => {
            const task = taskHandler.createTask('TestEndpoint', provider, 'ScanEndpoint');
            task.state = 'inProgress';
            task.start = Date.now();

            const status = provider.getUpdateStatus('TestEndpoint');
            expect(status).toEqual({ name: 'TestEndpoint', status: 'scanning', start: task.start });
        });
    });
});
