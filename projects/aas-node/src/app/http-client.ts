/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import net from 'net';
import { Readable } from 'stream';
import { singleton } from 'tsyringe';
import { ApplicationError } from 'aas-core';
import { parseUrl } from './utilities.js';

/**
 * A simple HTTP client for making requests to servers.
 */
@singleton()
export class HttpClient {
    /**
     * Gets a JSON value of type `T` from a server.
     * @template T The type of the object.
     * @param url The URL of the object.
     * @param headers Additional outgoing http headers.
     * @returns The requested object.
     */
    public async get<T extends object>(url: URL, headers?: Record<string, string>): Promise<T> {
        const response = await fetch(url.href, { method: 'GET', headers });
        if (!response.ok) {
            const message = await response.text().catch(() => 'GET request failed');
            throw new ApplicationError(message, {}, response.status);
        }

        return (await response.json()) as T;
    }

    /**
     * Gets a JSON value of type `T` from a server (no cache, no logging).
     * @param url The URL to send the GET request to.
     * @param headers The additional outgoing http headers.
     * @returns The requested value.
     */
    public async getLive<T extends object>(url: URL, headers?: Record<string, string>): Promise<T> {
        const response = await fetch(url.href, { method: 'GET', headers });
        if (!response.ok) {
            const message = await response.text().catch(() => 'GET live request failed');
            throw new ApplicationError(message, {}, response.status);
        }

        return (await response.json()) as T;
    }

    /**
     * Sends a GET request to the specified URL and returns the response body as a Node.js ReadableStream.
     * @param url - The URL to send the GET request to.
     * @param headers - Optional HTTP headers to include in the request.
     * @returns A promise that resolves to a Node.js ReadableStream containing the response body.
     * @throws If the response status is not OK (status code outside the 200–299 range).
     */
    public async getReadable(url: URL, headers?: Record<string, string>): Promise<NodeJS.ReadableStream> {
        const response = await fetch(url.href, { method: 'GET', headers });
        if (!response.ok) {
            const message = await response.text().catch(() => 'GET request failed');
            throw new ApplicationError(message, {}, response.status);
        }

        if (!response.body) {
            const message = await response.text().catch(() => 'GET readable failed');
            throw new ApplicationError(message, {}, 400);
        }

        return Readable.fromWeb(response.body);
    }

    /**
     * Sends a PUT request with a JSON payload to the specified URL.
     *
     * @param url - The target URL to which the PUT request will be sent.
     * @param obj - The object to be serialized as JSON and sent in the request body.
     * @param headers - Optional additional headers to include in the request.
     * @returns A promise that resolves to the response body as a string.
     * @throws {Error} If the HTTP response status is not OK (status code outside the range 200-299).
     */
    public async put(url: URL, obj: object, headers: Record<string, string> = {}): Promise<void> {
        const response = await fetch(url.href, {
            method: 'PUT',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(obj),
        });

        if (!response.ok) {
            const message = await response.text().catch(() => 'PUT request failed');
            throw new ApplicationError(message, {}, response.status);
        }
    }

    /**
     * Deletes an object.
     * @param url The URL of the object to delete.
     * @param headers Additional outgoing http headers.
     */
    public async delete(url: URL, headers?: Record<string, string>): Promise<void> {
        const response = await fetch(url.href, {
            method: 'DELETE',
            headers,
        });

        if (!response.ok) {
            const message = await response.text().catch(() => 'DELETE request failed');
            throw new ApplicationError(message, {}, response.status);
        }
    }

    /**
     * Sends a POST request with a JSON payload to the specified URL.
     * @param url - The target URL to which the POST request will be sent.
     * @param obj - The object to be serialized as JSON and sent in the request body.
     * @param headers - Optional additional headers to include in the request.
     * @returns A promise that resolves to the response body as a string.
     * @throws {Error} If the HTTP response status is not OK (status code outside the range 200-299).
     */
    public async postJson(url: URL, obj: object, headers: Record<string, string> = {}): Promise<string> {
        const response = await fetch(url.href, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(obj),
        });

        if (!response.ok) {
            const message = await response.text().catch(() => 'POST request failed');
            throw new ApplicationError(message, {}, response.status);
        }

        return await response.text();
    }

    /**
     * Sends a POST request with multipart/form-data using the provided FormData object.
     * @param url - The endpoint URL to which the form data will be posted.
     * @param formData - The FormData object containing the data to be sent in the request body.
     * @param headers - Optional additional headers to include in the request.
     * @returns A promise that resolves when the request completes successfully.
     * @throws {Error} If the response status is not OK (i.e., not in the 2xx range).
     */
    public async postFormData(url: URL, formData: FormData, headers: Record<string, string> = {}): Promise<void> {
        const response = await fetch(url.href, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const message = await response.text().catch(() => 'POST request failed');
            throw new ApplicationError(message, {}, response.status);
        }
    }

    /**
     * Checks the connection to an endpoint with the specified URL.
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
}
