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
import { Logger } from 'aas-package';

import { EndpointClientFactory } from '../client/endpoint-client-factory.js';
import { createSpyObj } from '../../test/mocks.js';
import { AASIndex } from '../index/aas-index.js';
import { EndpointProvider } from './endpoint-provider.js';
import { Parallel } from './parallel.js';
import { TaskHandler } from './task-handler.js';
import { Variable } from '../variable.js';
import { MessageSender } from './message-sender.js';

describe('EndpointController', () => {
    let provider: EndpointProvider;
    let index: Mocked<AASIndex>;
    let logger: Mocked<Logger>;
    let parallel: Mocked<Parallel>;
    let sender: Mocked<MessageSender>;
    let clientFactory: Mocked<EndpointClientFactory>;
    let variable: Mocked<Variable>;
    let taskHandler: TaskHandler;

    const endpoint: AASEndpoint = {
        name: 'Samples',
        url: 'file:///assets/samples',
        type: 'FileSystem',
    };

    beforeEach(() => {
        vi.useFakeTimers();

        logger = createSpyObj<Logger>(['info', 'error']);
        parallel = createSpyObj<Parallel>(['on', 'off', 'execute', 'cancel', 'terminate']);
        parallel.terminate.mockResolvedValue();

        clientFactory = createSpyObj<EndpointClientFactory>(['create', 'testAsync']);
        clientFactory.testAsync.mockResolvedValue();

        index = createSpyObj<AASIndex>([
            'insertEndpoint',
            'updateEndpoint',
            'clear',
            'getEndpoint',
            'findEndpoint',
            'getEndpoints',
            'getEndpointCount',
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

        provider = new EndpointProvider(variable, logger, parallel, clientFactory, index, taskHandler);
        sender = createSpyObj<MessageSender>(['send', 'destroy']);
        (provider as unknown as { sender: MessageSender }).sender = sender;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
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
            expect(sender.send).toHaveBeenCalledWith({
                type: 'EndpointAdded',
                endpoint: configuredEndpoint,
            });

            const task = taskHandler.find(configuredEndpoint.name, 'ScanEndpoint');
            expect(task).toBeDefined();

            vi.runOnlyPendingTimers();

            expect(parallel.execute).toHaveBeenCalledWith({
                type: 'EndpointScanData',
                taskId: task?.id,
                endpoint: configuredEndpoint,
            });
        });

        it('does not schedule scan for manual endpoints', async () => {
            const manualEndpoint: AASEndpoint = {
                ...endpoint,
                schedule: { type: 'manual' },
            };

            await provider.addEndpoint(manualEndpoint);

            expect(taskHandler.find(manualEndpoint.name, 'ScanEndpoint')).toBeUndefined();
            expect(parallel.execute).not.toHaveBeenCalled();
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
            expect(parallel.execute).not.toHaveBeenCalled();
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

            expect(parallel.execute).toHaveBeenCalledWith({
                type: 'EndpointScanData',
                taskId: task?.id,
                endpoint: recurringEndpoint,
            });
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
            expect(sender.send).toHaveBeenCalledWith({
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

            expect(parallel.execute).toHaveBeenCalledWith({
                type: 'EndpointScanData',
                taskId: task?.id,
                endpoint: {
                    ...endpoint,
                    schedule: { type: 'manual' },
                },
            });
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

            expect(parallel.cancel).toHaveBeenCalledWith({
                endpoint: 'Samples',
                taskId: task.id,
                type: 'CancelEndpointScanData',
            });
        });
    });

    describe('clear', () => {
        it('clears all endpoints when no endpoint name is provided', async () => {
            await provider.clearIndex();

            expect(index.clear).toHaveBeenCalled();
            expect(sender.send).toHaveBeenCalledWith({
                type: 'Cleared',
            });
        });

        it('clears a specific endpoint when an endpoint name is provided', async () => {
            await provider.clearIndex(endpoint.name);

            expect(index.clear).toHaveBeenCalledWith(endpoint.name);
            expect(sender.send).toHaveBeenCalledWith({
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
