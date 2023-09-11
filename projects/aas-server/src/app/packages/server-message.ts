/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import http from 'http';
import net from 'net';
import FormData from 'form-data';
import { parseUrl } from '../convert.js';

export class ServerMessage {
    /**
     * Gets an object of type `T` from a server.
     * @param url The URL of the object.
     * @template T The type of the object.
     * @returns The requested object.
     */
    public get<T>(url: URL): Promise<T> {
        return new Promise((result, reject) => {
            const options: http.RequestOptions = {
                host: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: 'GET',
                timeout: 3000
            };

            const request = http.request(options, (response) => {
                let data = '';
                response.on('data', (chunk: string) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        ServerMessage.checkStatusCode(response);
                        result(JSON.parse(data));
                    } catch (error) {
                        reject(error);
                    }
                });

                response.on('error', error => reject(error));
            });

            request.on('timeout', () => request.destroy())
                .on('error', error => reject(error))
                .end();
        });
    }

    /**
     * Gets the response of the request with the specified URL.
     * @param url The URL of the request.
     * @returns The request.
     */
    public getResponse(url: URL): Promise<http.IncomingMessage> {
        return new Promise((result, reject) => {
            const options: http.RequestOptions = {
                host: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: 'GET',
                timeout: 3000
            };

            const request = http.request(options, response => result(response));
            request.on('timeout', () => request.destroy())
                .on('error', (error) => reject(error))
                .end();
        });
    }

    /**
     * Updates the specified object.
     * @param url The destination URL.
     * @param obj The object to send.
     */
    public put<T>(url: URL, obj: object): Promise<T> {
        return new Promise<T>((result, reject) => {
            const data = JSON.stringify(obj);
            const options: http.RequestOptions = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            const request = http.request(options, (response) => {
                let responseData = '';
                response.on('data', function (chunk: string) {
                    responseData += chunk;
                });

                response.on('end', function () {
                    try {
                        ServerMessage.checkStatusCode(response);
                        result(JSON.parse(responseData));
                    } catch (error) {
                        reject(error);
                    }
                });

                response.on('error', function (error: Error) {
                    reject(error);
                });
            }).on('error', error => reject(error));

            request.write(data);
            request.end();
        });
    }

    /**
     * Inserts the specified object.
     * @param url The destination URL.
     * @param obj The object to send.
     */
    public post<T>(url: URL, obj: any): Promise<T> {
        return obj instanceof FormData ? this.postFormData(url, obj) : this.postObject(url, obj);
    }

    /**
     * Deletes an object.
     * @param url The URL of the object to delete.
     */
    public delete<T>(url: URL): Promise<T> {
        return new Promise<T>((result, reject) => {
            const options: http.RequestOptions = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            http.request(options, (response) => {
                let responseData = '';
                response.on('data', function (chunk: string) {
                    responseData += chunk;
                });

                response.on('end', function () {
                    try {
                        ServerMessage.checkStatusCode(response);
                        result(JSON.parse(responseData));
                    } catch (error) {
                        reject(error);
                    }
                });

                response.on('error', function (error: Error) {
                    reject(error);
                });
            }).on('error', error => reject(error))
                .end();
        });
    }

    /**
     * Checks the connection to resource with the specified URL.
     * @param url The current URL.
     */
    public async checkUrlExist(url: string): Promise<void> {
        const temp = parseUrl(url);
        const exist = await new Promise<boolean>((resolve, _) => {
            const socket = net.createConnection(Number(temp.port), temp.hostname);
            socket.setTimeout(3000);
            socket.on('connect', () => {
                socket.end();
                resolve(true);
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });

            socket.on('error', () => {
                socket.destroy();
                resolve(false);
            });
        });

        if (!exist) {
            throw new Error(`${url} does not exist.`);
        }
    }

    private postObject<T>(url: URL, obj: object): Promise<T> {
        return new Promise<T>((result, reject) => {
            const data = JSON.stringify(obj);
            const options: http.RequestOptions = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            const request = http.request(options, (response) => {
                let responseData = '';
                response.on('data', function (chunk: string) {
                    responseData += chunk;
                });

                response.on('end', function () {
                    try {
                        ServerMessage.checkStatusCode(response);
                        result(JSON.parse(responseData));
                    } catch (error) {
                        reject(error);
                    }
                });

                response.on('error', function (error: Error) {
                    reject(error);
                });
            }).on('error', error => reject(error));

            request.write(data);
            request.end();
        });
    }

    private postFormData<T>(url: URL, formData: FormData): Promise<T> {
        return new Promise<T>((result, reject) => {
            const options: http.RequestOptions = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: 'POST',
                headers: formData.getHeaders()
            };

            const request = http.request(options, (response) => {
                let responseData = '';
                response.on('data', function (chunk: string) {
                    responseData += chunk;
                });

                response.on('end', function () {
                    try {
                        ServerMessage.checkStatusCode(response);
                        result(JSON.parse(responseData));
                    } catch (error) {
                        reject(error);
                    }
                });

                response.on('error', function (error: Error) {
                    reject(error);
                });
            }).on('error', error => reject(error));

            formData.pipe(request);
        });
    }

    private static checkStatusCode(response: http.IncomingMessage): void {
        if (!response.statusCode) {
            throw new Error('Unknown status code.');
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error(`(${response.statusCode}) ${response.statusMessage}`);
        }
    }
}