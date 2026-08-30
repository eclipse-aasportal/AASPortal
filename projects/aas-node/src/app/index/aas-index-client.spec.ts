/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { container } from 'tsyringe';
import { MessagePort, Worker } from 'worker_threads';
import { aas, AASCursor } from 'aas-core';
import { AASIndexClient } from './aas-index-client.js';
import { Variable } from '../variable.js';
import { createSpyObj } from '../../test/mocks.js';
import { ChannelCommand, ChannelError, ChannelResponse } from './aas-index.js';

vi.mock(import('worker_threads'), () => {
    class WorkerMock implements Partial<Worker> {
        private handlers = new Map<string | symbol, Array<(...args: unknown[]) => void>>();

        public postMessage = vi.fn();

        public terminate = vi.fn(async () => 0);

        public emit = vi.fn((event: string | symbol, ...args: unknown[]) => {
            this.handlers.get(event)?.forEach(handler => handler(...args));
            return true;
        });

        public on = vi.fn((event: string | symbol, handler: (...args: unknown[]) => void) => {
            if (!this.handlers.has(event)) {
                this.handlers.set(event, []);
            }

            this.handlers.get(event)!.push(handler);
            return this as unknown as Worker;
        });

        public once = vi.fn((event: string | symbol, handler: (...args: unknown[]) => void) => {
            if (!this.handlers.has(event)) {
                this.handlers.set(event, []);
            }

            const onceHandler = (...args: unknown[]): void => {
                handler(...args);
                this.off(event, onceHandler);
            };

            this.handlers.get(event)!.push(onceHandler);
            return this as unknown as Worker;
        });

        public off = vi.fn((event: string | symbol, handler: (...args: unknown[]) => void) => {
            if (this.handlers.has(event)) {
                const handlers = this.handlers.get(event)!;
                const index = handlers.indexOf(handler);
                if (index !== -1) {
                    handlers.splice(index, 1);
                }
            }

            return this as unknown as Worker;
        });
    }

    class MessagePortMock implements Partial<MessagePort> {
        private handlers = new Map<string, Array<(...args: unknown[]) => void>>();

        public postMessage = vi.fn();

        public emit = vi.fn((event: string, ...args: unknown[]) => {
            this.handlers.get(event)?.forEach(handler => handler(...args));
            return true;
        });

        public on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
            if (!this.handlers.has(event)) {
                this.handlers.set(event, []);
            }

            this.handlers.get(event)!.push(handler);
            return this as unknown as MessagePort;
        });

        public off = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
            if (this.handlers.has(event)) {
                const handlers = this.handlers.get(event)!;
                const index = handlers.indexOf(handler);
                if (index !== -1) {
                    handlers.splice(index, 1);
                }
            }

            return this as unknown as MessagePort;
        });
    }

    return {
        default: {},
        Worker: WorkerMock,
        MessageChannel: class {
            public port1 = new MessagePortMock();
            public port2 = new MessagePortMock();
        },

        isMainThread: true,
        parentPort: {
            on: vi.fn(),
        },
        SHARE_ENV: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
});

describe('AASIndexClient', () => {
    let client: AASIndexClient;
    let variable: Mocked<Variable>;

    beforeEach(() => {
        container.clearInstances();
        variable = createSpyObj<Variable>([], { CONTENT_ROOT: 'content-root' });
        container.registerInstance(Variable, variable);

        client = container.resolve(AASIndexClient);
    });

    it('should be created', () => {
        expect(client).toBeInstanceOf(AASIndexClient);
    });

    it('should connect to the worker', () => {
        const port: Mocked<MessagePort> = createSpyObj<MessagePort>(['postMessage', 'on', 'off']);
        client.connect(port, 'worker-name');

        expect(client['worker']?.postMessage).toHaveBeenCalledWith(
            {
                application: 'IndexApp',
                type: 'command',
                name: 'connect',
                args: { port, name: 'worker-name' },
            },
            [port],
        );
    });

    it('should get document count', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: 42,
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        const result = await client.getDocumentCount('endpoint1');
        expect(result).toBe(42);
        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'GetDocumentCount',
            args: { endpoint: 'endpoint1' },
            id: 0,
        });
    });

    it('should get endpoints', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: [{ name: 'endpoint1' }, { name: 'endpoint2' }],
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        const result = await client.getEndpoints();
        expect(result).toEqual([{ name: 'endpoint1' }, { name: 'endpoint2' }]);
        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'GetEndpoints',
            args: {},
            id: 0,
        });
    });

    it('should get endpoint count', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: 5,
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        const result = await client.getEndpointCount();
        expect(result).toBe(5);
        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'GetEndpointCount',
            args: {},
            id: 0,
        });
    });

    it('should get endpoint', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: { name: 'endpoint1' },
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        const result = await client.getEndpoint('endpoint1');
        expect(result).toEqual({ name: 'endpoint1' });
        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'GetEndpoint',
            args: { name: 'endpoint1' },
            id: 0,
        });
    });

    it('should find endpoint', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: { name: 'endpoint1' },
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        const result = await client.findEndpoint('endpoint1');
        expect(result).toEqual({ name: 'endpoint1' });
        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'FindEndpoint',
            args: { name: 'endpoint1' },
            id: 0,
        });
    });

    it('should insert endpoint', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: undefined,
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        await client.insertEndpoint({
            name: 'Endpoint 1',
            type: 'AAS_API',
            url: 'http://localhost:1234',
        });

        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'InsertEndpoint',
            args: { endpoint: { name: 'Endpoint 1', type: 'AAS_API', url: 'http://localhost:1234' } },
            id: 0,
        });
    });

    it('should update endpoint', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: { name: 'endpoint1' },
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        const result = await client.updateEndpoint({
            name: 'endpoint1',
            type: 'AAS_API',
            url: 'http://localhost:1234',
        });

        expect(result).toEqual({ name: 'endpoint1' });
        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'UpdateEndpoint',
            args: { endpoint: { name: 'endpoint1', type: 'AAS_API', url: 'http://localhost:1234' } },
            id: 0,
        });
    });

    it('should delete endpoint', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: true,
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        const result = await client.deleteEndpoint('endpoint1');
        expect(result).toBe(true);
        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'DeleteEndpoint',
            args: { endpoint: 'endpoint1' },
            id: 0,
        });
    });

    it('should handle error response', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'error',
                message: 'Test error',
                id: message.id,
            } satisfies ChannelError;

            port.emit('message', response);
        });

        await expect(client.getEndpointCount()).rejects.toThrow('Test error');
        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'GetEndpointCount',
            args: {},
            id: 0,
        });
    });

    it('should handle unknown response type', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'error',
                message: 'Unknown response type',
                id: message.id,
            } satisfies ChannelError;

            port.emit('message', response);
        });

        await expect(client.getEndpointCount()).rejects.toThrow('Unknown response type');
        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'GetEndpointCount',
            args: {},
            id: 0,
        });
    });

    it('should clear endpoint', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: undefined,
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        await client.clear('endpoint1', 'id1');

        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'Clear',
            args: { endpoint: 'endpoint1', id: 'id1' },
            id: 0,
        });
    });

    it('should dispose the client', () => {
        const port = client['port'] as Mocked<MessagePort>;
        const worker = client['worker'] as Mocked<Worker>;

        client.dispose();

        expect(port.off).toHaveBeenCalledWith('message', client['onMessage']);
        expect(worker.postMessage).toHaveBeenCalledWith({
            application: 'IndexApp',
            type: 'command',
            name: 'shutdown',
            args: {},
        });
        expect(worker.once).toHaveBeenCalledWith('exit', client['onWorkerExit']);
    });

    it('should get documents', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: { items: [{ id: 'doc1' }, { id: 'doc2' }], totalCount: 2 },
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        const cursor: AASCursor = { limit: 42 };
        const result = await client.getDocuments(cursor, 'query1', 'en');
        expect(result).toEqual({ items: [{ id: 'doc1' }, { id: 'doc2' }], totalCount: 2 });
        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'GetDocuments',
            args: { cursor: { limit: 42 }, query: 'query1', language: 'en' },
            id: 0,
        });
    });

    it('should get endpoint documents', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: { items: [{ id: 'doc1' }, { id: 'doc2' }], totalCount: 2 },
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        const result = await client.getEndpointDocuments('endpoint1', 'cursor1', 10);
        expect(result).toEqual({ items: [{ id: 'doc1' }, { id: 'doc2' }], totalCount: 2 });
        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'GetEndpointDocuments',
            args: { endpoint: 'endpoint1', cursor: 'cursor1', limit: 10 },
            id: 0,
        });
    });

    it('should update document', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: undefined,
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        await client.update({
            id: 'doc1',
            endpoint: 'endpoint1',
            address: 'address1',
            idShort: 'short1',
            timestamp: Date.now(),
        });

        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'Update',
            args: {
                document: {
                    id: 'doc1',
                    endpoint: 'endpoint1',
                    address: 'address1',
                    idShort: 'short1',
                    timestamp: expect.any(Number),
                },
            },
            id: 0,
        });
    });

    it('should insert document', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: undefined,
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        await client.insert({
            id: 'doc1',
            endpoint: 'endpoint1',
            address: 'address1',
            idShort: 'short1',
            timestamp: Date.now(),
        });

        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'Insert',
            args: {
                document: {
                    id: 'doc1',
                    endpoint: 'endpoint1',
                    address: 'address1',
                    idShort: 'short1',
                    timestamp: expect.any(Number),
                },
            },
            id: 0,
        });
    });

    it('should create document', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: undefined,
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        await client.create('endpoint1', 'doc1', {} as aas.Environment);

        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'Create',
            args: {
                endpoint: 'endpoint1',
                id: 'doc1',
                env: {},
            },
            id: 0,
        });
    });

    it('should find document', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: {
                    id: 'doc1',
                    endpoint: 'endpoint1',
                    address: 'address1',
                    idShort: 'short1',
                    timestamp: Date.now(),
                },
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        const result = await client.find('endpoint1', 'AssetAdministrationShell', 'doc1');
        expect(result).toEqual({
            id: 'doc1',
            endpoint: 'endpoint1',
            address: 'address1',
            idShort: 'short1',
            timestamp: expect.any(Number),
        });
        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'Find',
            args: { endpoint: 'endpoint1', modelType: 'AssetAdministrationShell', id: 'doc1' },
            id: 0,
        });
    });

    it('should get document', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: {
                    id: 'doc1',
                    endpoint: 'endpoint1',
                    address: 'address1',
                    idShort: 'short1',
                    timestamp: Date.now(),
                },
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        const result = await client.get('endpoint1', 'AssetAdministrationShell', 'doc1');
        expect(result).toEqual({
            id: 'doc1',
            endpoint: 'endpoint1',
            address: 'address1',
            idShort: 'short1',
            timestamp: expect.any(Number),
        });

        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'Get',
            args: { endpoint: 'endpoint1', modelType: 'AssetAdministrationShell', id: 'doc1' },
            id: 0,
        });
    });

    it('should delete document', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: true,
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        const result = await client.delete('endpoint1', 'doc1');
        expect(result).toBe(true);
        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'Delete',
            args: { endpoint: 'endpoint1', id: 'doc1' },
            id: 0,
        });
    });

    it('should clear document', async () => {
        const port = client['port'] as Mocked<MessagePort>;
        port.postMessage.mockImplementation((message: ChannelCommand) => {
            const response = {
                type: 'response',
                name: message.name,
                result: undefined,
                id: message.id,
            } satisfies ChannelResponse;

            port.emit('message', response);
        });

        await client.clear('endpoint1', 'doc1');

        expect(port.postMessage).toHaveBeenCalledWith({
            type: 'command',
            name: 'Clear',
            args: { endpoint: 'endpoint1', id: 'doc1' },
            id: 0,
        });
    });
});
