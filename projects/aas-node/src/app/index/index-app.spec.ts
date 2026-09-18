/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { CommandData, Logger, LOGGER, WorkerData } from 'aas-package';

import { createSpyObj } from '../../test/mocks.js';
import { AAS_INDEX, AASIndex } from './aas-index.js';
import { IndexApp } from './index-app.js';

vi.mock(import('worker_threads'), () => {
    class MessagePortMock {
        private handlers = new Map<string, Array<(...args: unknown[]) => void>>();

        public postMessage = vi.fn((data: WorkerData) => {
            this.emit('message', data);
        });

        public emit = vi.fn((event: string, ...args: unknown[]) => {
            this.handlers.get(event)?.forEach(handler => handler(...args));
            return true;
        });

        public on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
            if (!this.handlers.has(event)) {
                this.handlers.set(event, []);
            }

            this.handlers.get(event)!.push(handler);
            return this;
        });

        public once = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
            if (!this.handlers.has(event)) {
                this.handlers.set(event, []);
            }

            const onceHandler = (...args: unknown[]): void => {
                handler(...args);
                this.off(event, onceHandler);
            };

            this.handlers.get(event)!.push(onceHandler);
            return this;
        });

        public off = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
            if (this.handlers.has(event)) {
                const handlers = this.handlers.get(event)!;
                const index = handlers.indexOf(handler);
                if (index !== -1) {
                    handlers.splice(index, 1);
                }
            }

            return this;
        });

        public close = vi.fn();
    }

    return {
        default: {},
        MessagePort: MessagePortMock,

        isMainThread: false,
        parentPort: new MessagePortMock(),
        SHARE_ENV: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
});

describe('IndexApp', () => {
    let index: Mocked<AASIndex>;
    let app: IndexApp;
    let parentPort: { postMessage: (data: WorkerData) => void };

    beforeEach(async () => {
        container.clearInstances();
        vi.clearAllMocks();
        index = createSpyObj<AASIndex>(['getDocumentCount', 'insertEndpoint']);
        container.registerInstance(AAS_INDEX, index);
        container.registerInstance(LOGGER, createSpyObj<Logger>(['info', 'warning', 'error']));
        container.registerSingleton(IndexApp);
        app = container.resolve(IndexApp);
        parentPort = (await import('worker_threads')).parentPort!;
    });

    it('should be created', () => {
        expect(app).toBeInstanceOf(IndexApp);
    });

    it('should post a message to the parent port', () => {
        const port = { on: vi.fn() };
        const data: CommandData = {
            type: 'command',
            name: 'ConnectIndex',
            args: {
                port,
            },
        };

        parentPort.postMessage(data);
        expect(port.on).toHaveBeenCalled();
    });
});
