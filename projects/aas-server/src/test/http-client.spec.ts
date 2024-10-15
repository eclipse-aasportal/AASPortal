/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import net from 'net';
import http, { IncomingMessage } from 'http';
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
            jest.spyOn(http, 'request').mockImplementation((_, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push(JSON.stringify({ text: 'Hello World!' }));
                stream.push(null);
                stream.statusCode = 200;
                stream.statusMessage = 'OK';
                (callback as (res: IncomingMessage) => void)(stream);
                return new http.ClientRequest('http://localhost:1234/hello/world');
            });
        });

        it('gets an object from a server', async () => {
            await expect(server.get<{ text: string }>(new URL('http://localhost:1234/hello/world'))).resolves.toEqual({
                text: 'Hello World!',
            });
        });
    });

    describe('getResponse', () => {
        beforeEach(() => {
            jest.spyOn(http, 'request').mockImplementation((_, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push(JSON.stringify({ text: 'Hello World!' }));
                stream.push(null);
                (callback as (res: IncomingMessage) => void)(stream);
                return new http.ClientRequest('http://localhost:1234/hello/world');
            });
        });

        it('gets the message response', async () => {
            await expect(server.getResponse(new URL('http://localhost:1234/hello/world'))).resolves.toBeTruthy();
        });
    });

    describe('put', () => {
        beforeEach(() => {
            jest.spyOn(http, 'request').mockImplementation((_, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push(JSON.stringify('OK'));
                stream.push(null);
                (callback as (res: IncomingMessage) => void)(stream);
                stream.statusCode = 200;
                stream.statusMessage = 'OK';
                return new http.ClientRequest('http://localhost:1234/hello/world');
            });
        });

        it('updates an object on a server', async () => {
            await expect(
                server.put(new URL('http://localhost:1234/hello/world'), { text: 'Hello World!' }),
            ).resolves.toEqual(JSON.stringify('OK'));
        });
    });

    describe('post', () => {
        beforeEach(() => {
            jest.spyOn(http, 'request').mockImplementation((_, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push(JSON.stringify('Created'));
                stream.push(null);
                (callback as (res: IncomingMessage) => void)(stream);
                stream.statusCode = 201;
                stream.statusMessage = 'Created';
                return new http.ClientRequest('http://localhost:1234/hello/world');
            });
        });

        it('updates an object on a server', async () => {
            await expect(
                server.post(new URL('http://localhost:1234/hello/world'), { text: 'Hello World!' }),
            ).resolves.toEqual(JSON.stringify('Created'));
        });
    });

    describe('delete', () => {
        beforeEach(() => {
            jest.spyOn(http, 'request').mockImplementation((_, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push(JSON.stringify('Deleted'));
                stream.push(null);
                (callback as (res: IncomingMessage) => void)(stream);
                stream.statusCode = 204;
                stream.statusMessage = 'No Content';
                return new http.ClientRequest('http://localhost:1234/hello/world');
            });
        });

        it('updates an object on a server', async () => {
            await expect(server.delete(new URL('http://localhost:1234/hello/world'))).resolves.toEqual(
                JSON.stringify('Deleted'),
            );
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
