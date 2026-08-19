/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOGGER, Logger } from 'aas-package';
import { EndpointScanWorkerPool } from './endpoint-scan-worker-pool';
import { createSpyObj } from '../../test/mocks';
import { CommandData, EventData } from '../types';

vi.mock(import('worker_threads'), () => {
    class WorkerMock {
        private handlers = new Map<string, Array<(...args: unknown[]) => void>>();

        public postMessage = vi.fn((message: { name?: string }) => {
            if (message?.name === 'CancelScan') {
                this.emit('message', {
                    type: 'event',
                    name: 'End',
                    args: {},
                    application: 'ScanApp',
                } satisfies EventData);
            }
        });

        public terminate = vi.fn(async () => 0);

        public emit = vi.fn((event: string, ...args: unknown[]) => {
            this.handlers.get(event)?.forEach(handler => handler(...args));
        });

        public on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
            if (!this.handlers.has(event)) {
                this.handlers.set(event, []);
            }

            this.handlers.get(event)!.push(handler);
        });

        public off = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
            if (this.handlers.has(event)) {
                const handlers = this.handlers.get(event)!;
                const index = handlers.indexOf(handler);
                if (index !== -1) {
                    handlers.splice(index, 1);
                }
            }
        });
    }

    return {
        default: {},
        Worker: WorkerMock,
        MessageChannel: class {
            public port1 = {
                on: vi.fn(),
                postMessage: vi.fn(),
            };
            public port2 = {
                on: vi.fn(),
                postMessage: vi.fn(),
            };
        },

        isMainThread: true,
        parentPort: {
            on: vi.fn(),
        },
        SHARE_ENV: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
});

vi.mock(import('fs'), () => {
    return {
        default: { existsSync: vi.fn().mockReturnValue(true) },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
});

describe('EndpointScanWorkerPool', () => {
    let workerPool: EndpointScanWorkerPool;

    beforeEach(() => {
        container.clearInstances();
        container.registerSingleton(EndpointScanWorkerPool, EndpointScanWorkerPool);
        container.registerInstance(LOGGER, createSpyObj<Logger>(['info', 'warning', 'error']));
        container.registerInstance('Variable', { CONTENT_ROOT: '/tmp' });
        container.registerInstance('AASIndexClient', createSpyObj(['connect', 'execute', 'cancel']));
        workerPool = container.resolve(EndpointScanWorkerPool);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be defined', () => {
        expect(workerPool).toBeInstanceOf(EndpointScanWorkerPool);
    });

    describe('execute', () => {
        it('should execute a command', () => {
            const commandData: CommandData = {
                type: 'command',
                name: 'scan',
                args: { endpoint: 'Endpoint 1' },
                application: 'test-app',
            };

            workerPool.execute(commandData);
            expect(workerPool['pool'].size).toBe(1);
        });
    });

    describe('cancel', () => {
        it('should cancel a task in the waiting queue', async () => {
            const commandData: CommandData = {
                type: 'command',
                name: 'scan',
                args: { taskId: 1, endpoint: 'Endpoint 1' },
                application: 'test-app',
            };

            workerPool.execute(commandData);
            await expect(workerPool.cancel(1, 'Endpoint 1')).resolves.toBe(void 0);
        });

        it('should cancel a task in the pool', async () => {
            workerPool.execute({
                type: 'command',
                name: 'scan',
                args: { taskId: 1, endpoint: 'Endpoint 1' },
                application: 'test-app',
            } satisfies CommandData);

            workerPool.execute({
                type: 'command',
                name: 'scan',
                args: { taskId: 2, endpoint: 'Endpoint 2' },
                application: 'test-app',
            } satisfies CommandData);

            workerPool.execute({
                type: 'command',
                name: 'scan',
                args: { taskId: 3, endpoint: 'Endpoint 3' },
                application: 'test-app',
            } satisfies CommandData);

            expect(workerPool['waiting'].length).toBe(1);
            await expect(workerPool.cancel(3, 'Endpoint 3')).resolves.toBe(void 0);
            expect(workerPool['waiting'].length).toBe(0);
        });

        it('should resolve if task is not found', async () => {
            await expect(workerPool.cancel(999, 'Nonexistent Endpoint')).resolves.toBeUndefined();
        });
    });

    describe('dispose', () => {
        it('should dispose all workers', async () => {
            workerPool.execute({
                type: 'command',
                name: 'scan',
                args: { taskId: 1, endpoint: 'Endpoint 1' },
                application: 'test-app',
            } satisfies CommandData);

            workerPool.execute({
                type: 'command',
                name: 'scan',
                args: { taskId: 2, endpoint: 'Endpoint 2' },
                application: 'test-app',
            } satisfies CommandData);

            await expect(workerPool.dispose()).resolves.toBe(void 0);
        });
    });
});
