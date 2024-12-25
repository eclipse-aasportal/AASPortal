/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import http from 'http';
import net from 'net';
import FormData from 'form-data';
import axios, { AxiosResponse } from 'axios';
import { singleton } from 'tsyringe';
import { parseUrl } from './convert.js';

@singleton()
export class HttpClient {
    /**
     * Gets an object of type `T` from a server.
     * @template T The type of the object.
     * @param url The URL of the object.
     * @param headers Additional outgoing http headers.
     * @returns The requested object.
     */
    public async get<T extends object>(url: URL, headers?: Record<string, string>): Promise<T> {
        const response: AxiosResponse<T> = await axios.get(url.toString(), {
            headers,
        });

        return response.data;
    }

    /**
     * Gets the response of the request with the specified URL.
     * @param url The URL of the request.
     * @param headers Additional outgoing http headers.
     * @returns The request.
     */
    public async getResponse(url: URL, headers?: Record<string, string>): Promise<http.IncomingMessage> {
        const response = await axios.get(url.toString(), {
            headers,
            responseType: 'stream',
        });

        return response.data;
    }

    /**
     * Updates the specified object.
     * @param url The destination URL.
     * @param obj The object to send.
     * @param headers Additional outgoing http headers.
     */
    public async put(url: URL, obj: object, headers?: Record<string, string>): Promise<string> {
        const response = await axios.put(url.toString(), {
            obj,
            headers,
        });

        const data = response.data;
        if (typeof data === 'string') {
            return data;
        }

        return response.statusText;
    }

    /**
     * Inserts the specified object.
     * @param url The destination URL.
     * @param obj The object to send.
     * @param headers Additional outgoing http headers.
     */
    public post(url: URL, obj: FormData | object, headers?: Record<string, string>): Promise<string> {
        return obj instanceof FormData ? this.postFormData(url, obj, headers) : this.postObject(url, obj, headers);
    }

    /**
     * Deletes an object.
     * @param url The URL of the object to delete.
     * @param headers Additional outgoing http headers.
     */
    public async delete(url: URL, headers?: Record<string, string>): Promise<string> {
        const response = await axios.delete(url.toString(), {
            headers,
        });

        const data = response.data;
        if (typeof data === 'string') {
            return data;
        }

        return response.statusText;
    }

    /**
     * Checks the connection to resource with the specified URL.
     * @param url The current URL.
     */
    public checkUrlExist(url: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const temp = parseUrl(url);
            const port = Number(temp.port ? temp.port : temp.protocol === 'http:' ? 80 : 443);
            const socket = net.createConnection(port, temp.hostname);
            socket.setTimeout(3000);
            socket
                .on('connect', () => {
                    socket.end();
                })
                .on('end', () => {
                    socket.destroy();
                    resolve();
                })
                .on('timeout', () => {
                    socket.destroy();
                    reject(new Error(`${url} does not exist.`));
                })
                .on('error', () => {
                    socket.destroy();
                    reject(new Error(`${url} does not exist.`));
                });
        });
    }

    private async postObject(url: URL, obj: object, headers: Record<string, string> | undefined): Promise<string> {
        const response = await axios.post(url.toString(), obj, { headers });
        const data = response.data;
        if (typeof data === 'string') {
            return data;
        }

        return response.statusText;
    }

    private async postFormData(url: URL, formData: FormData, headers?: Record<string, string>): Promise<string> {
        const response = await axios.post(url.toString(), formData, { headers });
        const data = response.data;
        if (typeof data === 'string') {
            return data;
        }

        return response.statusText;
    }
}
