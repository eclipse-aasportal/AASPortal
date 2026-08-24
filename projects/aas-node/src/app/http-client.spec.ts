/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import net from 'net';
import { Readable } from 'stream';
import { describe, beforeEach, it, expect, afterEach, vi, Mocked } from 'vitest';
import { HttpClient } from './http-client.js';
import { createSpyObj } from '../test/mocks.js';

describe('HttpClient', () => {
    let client: HttpClient;

    beforeEach(() => {
        client = new HttpClient();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should created', () => {
        expect(client).toBeTruthy();
    });

    describe('getReadable', () => {
        let mockStream: Mocked<ReadableStream>;

        beforeEach(() => {
            mockStream = createSpyObj<ReadableStream>(['getReader']);
        });

        it('returns a readable stream when response is ok', async () => {
            const response = createSpyObj<Response>(['json', 'text', 'clone'], {
                ok: true,
                status: 200,
                statusText: 'OK',
                body: mockStream,
            });

            vi.spyOn(global, 'fetch').mockResolvedValue(response);
            vi.spyOn(Readable, 'fromWeb').mockReturnValue(new Readable());

            const result = await client.getReadable(new URL('http://localhost:1234/hello/world'));
            expect(Readable.fromWeb).toHaveBeenCalled();
            expect(result.read).toBeTruthy();
        });

        it('throws an error when response is not ok', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                body: null,
            } as Response;

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(client.getReadable(new URL('http://localhost:1234/hello/world'))).rejects.toThrow();
        });

        it('returns an empty readable stream if response.body is null', async () => {
            const response = {
                ok: true,
                status: 200,
                statusText: 'OK',
                body: null,
            } as Response;

            vi.spyOn(global, 'fetch').mockResolvedValue(response);

            await expect(() => client.getReadable(new URL('http://localhost:1234/hello/world'))).rejects.toThrowError();
        });
    });

    describe('get', () => {
        it('should resolve with parsed JSON when response is ok', async () => {
            const mockData = { foo: 'bar' };
            const response = createSpyObj<Response>(['json', 'text', 'clone'], {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new Headers([['content-type', 'application/json']]),
                body: createSpyObj<ReadableStream>([]),
            });

            response.json.mockResolvedValue(mockData);
            vi.spyOn(global, 'fetch').mockResolvedValue(response);

            const result = await client.get<typeof mockData>(new URL('http://localhost:1234/test'));
            expect(result).toEqual(mockData);
            expect(response.json).toHaveBeenCalled();
        });

        it('should reject with error when response is not ok', async () => {
            const response = createSpyObj<Response>(['json', 'text', 'clone'], {
                ok: false,
                status: 404,
                statusText: 'Not found',
                headers: new Headers([['content-type', 'application/json']]),
                body: createSpyObj<ReadableStream>([]),
            });

            vi.spyOn(global, 'fetch').mockResolvedValue(response);

            await expect(client.get<object>(new URL('http://localhost:1234/test'))).rejects.toThrow();
        });

        it('should reject if response.json throws', async () => {
            const response = createSpyObj<Response>(['json', 'text', 'clone', 'json'], {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new Headers([['content-type', 'application/json']]),
                body: createSpyObj<ReadableStream>([]),
            });

            response.json.mockRejectedValue(new Error('JSON parse error'));
            vi.spyOn(global, 'fetch').mockResolvedValue(response);

            await expect(client.get<object>(new URL('http://localhost:1234/test'))).rejects.toThrow('JSON parse error');
        });
    });

    describe('put', () => {
        it('should resolve when response is ok', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                body: null,
            } as unknown as Response;

            const spy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(
                client.put(new URL('http://localhost:1234/test'), { foo: 'bar' }, { 'X-Test': 'yes' }),
            ).resolves.toBe(void 0);

            expect(spy).toHaveBeenCalledWith(
                'http://localhost:1234/test',
                expect.objectContaining({
                    method: 'PUT',
                    headers: {
                        'X-Test': 'yes',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ foo: 'bar' }),
                }),
            );
        });

        it('should throw error when response is not ok', async () => {
            const response = createSpyObj<Response>(['json', 'text', 'clone'], {
                ok: false,
                status: 400,
                statusText: 'Bad Request',
            });

            vi.spyOn(global, 'fetch').mockResolvedValue(response);

            await expect(client.put(new URL('http://localhost:1234/test'), { foo: 'bar' })).rejects.toThrow();
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
                client.delete(new URL('http://localhost:1234/test'), { 'X-Test': 'yes' }),
            ).resolves.toBeUndefined();

            expect(spy).toHaveBeenCalledWith(
                'http://localhost:1234/test',
                expect.objectContaining({
                    method: 'DELETE',
                    headers: { 'X-Test': 'yes' },
                }),
            );
        });

        it('should throw error when response is not ok', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
            } as unknown as Response;

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(client.delete(new URL('http://localhost:1234/test'))).rejects.toThrow();
        });
    });

    describe('checkUrlExist', () => {
        it('validates a connection', async () => {
            const response = createSpyObj<Response>([], { ok: true });
            const mock = vi.spyOn(global, 'fetch').mockResolvedValue(response);
            await expect(client.checkUrlExist('http://localhost:9876')).resolves.toBe(void 0);
            expect(mock).toHaveBeenCalledWith('http://localhost:9876', expect.objectContaining({ method: 'HEAD' }));
        });

        it('throws an error if a connection does not exist', async () => {
            const response = createSpyObj<Response>([], { ok: false });
            const mock = vi.spyOn(global, 'fetch').mockResolvedValue(response);
            await expect(client.checkUrlExist('http://localhost:9876')).rejects.toThrow(
                'Failed to connect to http://localhost:9876: response.text is not a function',
            );

            expect(mock).toHaveBeenCalledWith('http://localhost:9876', expect.objectContaining({ method: 'HEAD' }));
        });
    });

    describe('post', () => {
        it('should resolve with response text when response is ok', async () => {
            const mockResponse = createSpyObj<Response>(['text'], {
                ok: true,
                status: 201,
                statusText: 'Created',
                body: null,
                headers: new Headers(),
            });

            mockResponse.text.mockResolvedValue('success');
            const mock = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            const result = await client.post(
                new URL('http://localhost:1234/test'),
                { foo: 'bar' },
                { 'X-Test': 'yes' },
            );

            expect(result).toBe('success');
            expect(mock).toHaveBeenCalledWith('http://localhost:1234/test', {
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
            const mockResponse = createSpyObj<Response>(['text'], {
                ok: false,
                status: 201,
                statusText: 'Created',
                body: null,
                headers: new Headers(),
            });

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(client.post(new URL('http://localhost:1234/test'), { foo: 'bar' })).rejects.toThrow();
        });

        it('should throw if response.text throws', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                text: vi.fn().mockRejectedValue(new Error('Text parse error')),
            } as unknown as Response;

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

            await expect(client.post(new URL('http://localhost:1234/test'), { foo: 'bar' })).rejects.toThrow(
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
                client.postFormData(new URL('http://localhost:1234/test'), formData, { 'X-Test': 'yes' }),
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

            await expect(client.postFormData(new URL('http://localhost:1234/test'), formData)).rejects.toThrow();
        });
    });
});
