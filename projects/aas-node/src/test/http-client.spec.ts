/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import net from 'net';
import { HttpClient } from '../app/http-client.js';
import { describe, beforeEach, it, expect, afterEach, vi, Mocked } from 'vitest';
import { createSpyObj } from './mocks.js';

describe('HttpClient', () => {
    let server: HttpClient;

    beforeEach(() => {
        server = new HttpClient();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should created', () => {
        expect(server).toBeTruthy();
    });

    describe('getReadable', () => {
        let mockStream: ReadableStream<Uint8Array>;

        beforeEach(() => {
            mockStream = {
                getReader: vi.fn().mockReturnValue({
                    read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
                }),
            } as unknown as ReadableStream<Uint8Array>;
        });

        it('returns a readable stream when response is ok', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                body: mockStream,
            } as Response;

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            const result = await server.getReadable(new URL('http://localhost:1234/hello/world'));
            expect(result).toBeTruthy();
            expect(typeof result.read).toBe('function');
        });

        it('throws an error when response is not ok', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                body: null,
            } as Response;

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(server.getReadable(new URL('http://localhost:1234/hello/world'))).rejects.toThrow(
                'GET readable failed: Not Found (404)',
            );
        });

        it('returns an empty readable stream if response.body is null', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                body: null,
            } as Response;
            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            const result = await server.getReadable(new URL('http://localhost:1234/hello/world'));
            expect(result).toBeTruthy();
            expect(typeof result.read).toBe('function');
        });
    });

    describe('getJson', () => {
        it('should resolve with parsed JSON when response is ok', async () => {
            const mockData = { foo: 'bar' };
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                json: vi.fn().mockReturnValue(Promise.resolve(mockData)),
            } as unknown as Response;

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            const result = await server.getJson<typeof mockData>(new URL('http://localhost:1234/test'));
            expect(result).toEqual(mockData);
            expect(mockResponse.json).toHaveBeenCalled();
        });

        it('should reject with error when response is not ok', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: vi.fn().mockReturnValue(Promise.reject(new Error('Should not be called'))),
            } as unknown as Response;

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(server.getJson<object>(new URL('http://localhost:1234/test'))).rejects.toThrow(
                'GET failed: Not Found (404)',
            );
        });

        it('should reject if response.json throws', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                json: vi.fn().mockRejectedValue(new Error('JSON parse error')),
            } as unknown as Response;

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(server.getJson<object>(new URL('http://localhost:1234/test'))).rejects.toThrow(
                'JSON parse error',
            );
        });
    });

    describe('put', () => {
        it('should resolve when response is ok', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
            } as unknown as Response;

            const spy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(
                server.put(new URL('http://localhost:1234/test'), { foo: 'bar' }, { 'X-Test': 'yes' }),
            ).resolves.toBeUndefined();

            expect(spy).toHaveBeenCalledWith('http://localhost:1234/test', {
                method: 'PUT',
                headers: {
                    'X-Test': 'yes',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ foo: 'bar' }),
            });
        });

        it('should throw error when response is not ok', async () => {
            const mockResponse = {
                ok: false,
                status: 400,
                statusText: 'Bad Request',
            } as unknown as Response;

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(server.put(new URL('http://localhost:1234/test'), { foo: 'bar' })).rejects.toThrow(
                'PUT failed: Bad Request (400)',
            );
        });
    });

    describe('delete', () => {
        it('should resolve when response is ok', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
            } as unknown as Response;

            const spy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(
                server.delete(new URL('http://localhost:1234/test'), { 'X-Test': 'yes' }),
            ).resolves.toBeUndefined();

            expect(spy).toHaveBeenCalledWith('http://localhost:1234/test', {
                method: 'DELETE',
                headers: { 'X-Test': 'yes' },
            });
        });

        it('should throw error when response is not ok', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
            } as unknown as Response;

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(server.delete(new URL('http://localhost:1234/test'))).rejects.toThrow(
                'DELETE failed: Not Found (404)',
            );
        });
    });

    describe('checkUrlExist', () => {
        let socket: Mocked<net.Socket>;

        beforeEach(() => {
            socket = createSpyObj<net.Socket>(['setTimeout', 'on', 'end', 'destroy', 'timeout']);
        });

        it('validates a connection', async () => {
            socket.on.mockImplementation((event, listener) => {
                if ((event as string) === 'end') {
                    setTimeout(() => (listener as () => void)());
                }

                return socket;
            });

            vi.spyOn(net, 'createConnection').mockReturnValue(socket);
            await expect(server.checkUrlExist('http://localhost:1234')).resolves.toBeUndefined();
        });

        it('throws an error if a connection does not exist', async () => {
            socket.on.mockImplementation((event, listener) => {
                if (event === 'timeout') {
                    setTimeout(() => (listener as () => void)());
                }

                return socket;
            });

            vi.spyOn(net, 'createConnection').mockReturnValue(socket);
            await expect(server.checkUrlExist('http://localhost:9876')).rejects.toThrow();
        });
    });

    describe('postJson', () => {
        it('should resolve with response text when response is ok', async () => {
            const mockResponse = {
                ok: true,
                status: 201,
                statusText: 'Created',
                text: vi.fn().mockResolvedValue('success'),
            } as unknown as Response;

            const spy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            const result = await server.postJson(
                new URL('http://localhost:1234/test'),
                { foo: 'bar' },
                { 'X-Test': 'yes' },
            );
            expect(result).toBe('success');
            expect(spy).toHaveBeenCalledWith('http://localhost:1234/test', {
                method: 'POST',
                headers: {
                    'X-Test': 'yes',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ foo: 'bar' }),
            });
            expect(mockResponse.text).toHaveBeenCalled();
        });

        it('should throw error when response is not ok', async () => {
            const mockResponse = {
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                text: vi.fn(),
            } as unknown as Response;

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(server.postJson(new URL('http://localhost:1234/test'), { foo: 'bar' })).rejects.toThrow(
                'POST JSON failed: Bad Request (400)',
            );
        });

        it('should throw if response.text throws', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                text: vi.fn().mockRejectedValue(new Error('Text parse error')),
            } as unknown as Response;

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(server.postJson(new URL('http://localhost:1234/test'), { foo: 'bar' })).rejects.toThrow(
                'Text parse error',
            );
        });
    });

    describe('postFormData', () => {
        it('should resolve when response is ok', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
            } as unknown as Response;

            const formData = {} as FormData;
            const spy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(
                server.postFormData(new URL('http://localhost:1234/test'), formData, { 'X-Test': 'yes' }),
            ).resolves.toBeUndefined();

            expect(spy).toHaveBeenCalledWith('http://localhost:1234/test', {
                method: 'POST',
                headers: { 'X-Test': 'yes' },
                body: formData,
            });
        });

        it('should throw error when response is not ok', async () => {
            const mockResponse = {
                ok: false,
                status: 400,
                statusText: 'Bad Request',
            } as unknown as Response;

            const formData = {} as FormData;
            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(server.postFormData(new URL('http://localhost:1234/test'), formData)).rejects.toThrow(
                'POST FormData failed: Bad Request (400)',
            );
        });
    });
});
