/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import net from 'net';
import { IncomingMessage } from 'http';
import axios from 'axios';
import { Socket } from 'net';
import { HttpClient } from '../app/http-client.js';
import { createSpyObj } from 'fhg-jest';
import { describe, beforeEach, it, expect, jest, afterEach } from '@jest/globals';

describe('HttpClient', () => {
    let server: HttpClient;

    beforeEach(() => {
        server = new HttpClient();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should created', () => {
        expect(server).toBeTruthy();
    });

    describe('get', () => {
        beforeEach(() => {
            jest.spyOn(axios, 'get').mockResolvedValue({ data: { text: 'Hello World!' } });
        });

        it('gets an object from a server', async () => {
            await expect(server.get<{ text: string }>(new URL('http://localhost:1234/hello/world'))).resolves.toEqual({
                text: 'Hello World!',
            });
        });
    });

    describe('getResponse', () => {
        beforeEach(() => {
            const stream = new IncomingMessage(new Socket());
            stream.push(JSON.stringify({ text: 'Hello World!' }));
            stream.push(null);
            jest.spyOn(axios, 'get').mockResolvedValue({ data: stream });
        });

        it('gets the message response', async () => {
            await expect(server.getResponse(new URL('http://localhost:1234/hello/world'))).resolves.toBeTruthy();
        });
    });

    describe('put', () => {
        beforeEach(() => {
            jest.spyOn(axios, 'put').mockResolvedValue({ data: 42, statusText: 'OK' });
        });

        it('updates an object on a server', async () => {
            await expect(
                server.put(new URL('http://localhost:1234/hello/world'), { text: 'Hello World!' }),
            ).resolves.toEqual('OK');
        });
    });

    describe('post', () => {
        beforeEach(() => {
            jest.spyOn(axios, 'post').mockResolvedValue({ data: 4711, statusText: 'Created' });
        });

        it('updates an object on a server', async () => {
            await expect(
                server.post(new URL('http://localhost:1234/hello/world'), { text: 'Hello World!' }),
            ).resolves.toEqual('Created');
        });
    });

    describe('delete', () => {
        beforeEach(() => {
            jest.spyOn(axios, 'delete').mockResolvedValue({ data: {}, statusText: 'Deleted' });
        });

        it('updates an object on a server', async () => {
            await expect(server.delete(new URL('http://localhost:1234/hello/world'))).resolves.toEqual('Deleted');
        });
    });

    describe('checkUrlExist', () => {
        let socket: jest.Mocked<net.Socket>;

        beforeEach(() => {
            socket = createSpyObj<net.Socket>(['setTimeout', 'on', 'end', 'destroy']);
        });

        it('validates a connection', async () => {
            socket.on.mockImplementation((event, listener) => {
                if (event === 'end') {
                    setTimeout(() => (listener as () => void)());
                }

                return socket;
            });

            jest.spyOn(net, 'createConnection').mockReturnValue(socket);
            await expect(server.checkUrlExist('http://localhost:1234')).resolves.toBeUndefined();
        });

        it('throws an error if a connection does not exist', async () => {
            socket.on.mockImplementation((event, listener) => {
                if (event === 'timeout') {
                    setTimeout(() => (listener as () => void)());
                }

                return socket;
            });

            jest.spyOn(net, 'createConnection').mockReturnValue(socket);
            await expect(server.checkUrlExist('http://localhost:9876')).rejects.toThrowError();
        });
    });
});
