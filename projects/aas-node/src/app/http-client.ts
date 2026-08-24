/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Readable } from 'stream';
import { singleton } from 'tsyringe';
import { ApplicationError } from 'aas-core';

/**
 * A simple HTTP client for making requests to servers.
 */
@singleton()
export class HttpClient {
    private readonly DEFAULT_TIMEOUT_MS = 5000;

    /**
     * Gets a JSON value of type `T` from a server.
     * @template T The type of the object.
     * @param url The URL of the object.
     * @param headers Additional outgoing http headers.
     * @returns The requested object.
     */
    public async get<T = unknown>(url: URL, headers?: Record<string, string>): Promise<T> {
        const response = await this.retryableRequest(() => this.fetchWithTimeout(url.href, { method: 'GET', headers }));
        await this.handleResponse(response, 'GET');
        return this.parseJson(response);
    }

    /**
     * Sends a GET request to the specified URL and returns the response body as a Node.js ReadableStream.
     * @param url - The URL to send the GET request to.
     * @param headers - Optional HTTP headers to include in the request.
     * @returns A promise that resolves to a Node.js ReadableStream containing the response body.
     * @throws If the response status is not OK (status code outside the 200–299 range).
     */
    public async getReadable(url: URL, headers?: Record<string, string>): Promise<NodeJS.ReadableStream> {
        const response = await this.retryableRequest(() => this.fetchWithTimeout(url.href, { method: 'GET', headers }));
        await this.handleResponse(response, 'GET');

        if (!response.body) {
            throw new ApplicationError('Response body missing.', {}, 400);
        }

        return Readable.fromWeb(response.body);
    }

    /**
     * Sends a PUT request with a JSON payload to the specified URL.
     *
     * @param url - The target URL to which the PUT request will be sent.
     * @param data - The object to be serialized as JSON and sent in the request body.
     * @param headers - Optional additional headers to include in the request.
     * @throws {Error} If the HTTP response status is not OK (status code outside the range 200-299).
     */
    public async put<T = unknown>(url: URL, data: unknown, headers?: Record<string, string>): Promise<T> {
        const response = await this.retryableRequest(() =>
            this.fetchWithTimeout(url.href, {
                method: 'PUT',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            }),
        );

        await this.handleResponse(response, 'PUT');
        return this.parseBody(response) as T;
    }

    /**
     * Sends a POST request with a JSON payload to the specified URL.
     * @param url - The target URL to which the POST request will be sent.
     * @param data - The object to be serialized as JSON and sent in the request body.
     * @param headers - Optional additional headers to include in the request.
     * @throws {Error} If the HTTP response status is not OK (status code outside the range 200-299).
     */
    public async post<T = unknown>(url: URL, data: unknown, headers?: Record<string, string>): Promise<T> {
        const response = await this.retryableRequest(() =>
            this.fetchWithTimeout(url.href, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            }),
        );

        await this.handleResponse(response, 'POST');
        return this.parseBody(response) as T;
    }

    /**
     * Sends a POST request with multipart/form-data using the provided FormData object.
     * @param url - The endpoint URL to which the form data will be posted.
     * @param formData - The FormData object containing the data to be sent in the request body.
     * @param headers - Optional additional headers to include in the request.
     * @returns A promise that resolves when the request completes successfully.
     * @throws {Error} If the response status is not OK (i.e., not in the 2xx range).
     */
    public async postFormData<T = unknown>(
        url: URL,
        formData: FormData,
        headers?: Record<string, string>,
    ): Promise<unknown> {
        const response = await this.retryableRequest(() =>
            this.fetchWithTimeout(url.href, {
                method: 'POST',
                headers,
                body: formData,
            }),
        );

        await this.handleResponse(response, 'POST');
        return this.parseBody(response) as T;
    }

    /**
     * Deletes an object.
     * @param url The URL of the object to delete.
     * @param headers Additional outgoing http headers.
     */
    public async delete(url: URL, headers?: Record<string, string>): Promise<void> {
        const response = await this.retryableRequest(() =>
            this.fetchWithTimeout(url.href, {
                method: 'DELETE',
                headers,
            }),
        );

        await this.handleResponse(response, 'DELETE');
    }

    /**
     * Checks the connection to an endpoint with the specified URL.
     * @param url The current URL.
     */
    public async checkUrlExist(url: string, timeoutMs: number = 5000): Promise<void> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
            });

            await this.handleResponse(response, 'HEAD');
        } catch (error) {
            throw new ApplicationError(
                `Failed to connect to ${url}: ${error instanceof Error ? error.message : String(error)}`,
                {},
                503,
            );
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private async retryableRequest(
        fn: () => Promise<Response>,
        maxRetries = 3,
        backoffMs = 1000,
        retryableStatuses = [408, 429, 500, 502, 503, 504],
    ): Promise<Response> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fn();
                const shouldRetry = retryableStatuses.includes(response.status) && attempt < maxRetries - 1;
                if (shouldRetry) {
                    await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
                    continue;
                }

                return response;
            } catch (error) {
                if (attempt === maxRetries - 1) {
                    throw error;
                }

                await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
            }
        }

        throw new Error('Max retries exceeded');
    }

    private async fetchWithTimeout(
        url: string,
        options: RequestInit,
        timeoutMs = this.DEFAULT_TIMEOUT_MS,
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private async handleResponse(response: Response, method: string): Promise<void> {
        if (!response.ok) {
            const message = await response.text().catch(() => `${method} request failed`);
            throw new ApplicationError(message, {}, response.status);
        }
    }

    private async parseJson<T>(response: Response): Promise<T> {
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            const body = await response.text();
            throw new ApplicationError(
                `Expected JSON but got ${contentType}. Response: ${body.substring(0, 200)}`,
                {},
                400,
            );
        }

        try {
            return (await response.json()) as T;
        } catch (error) {
            throw new ApplicationError(`Failed to parse JSON: ${error}`, {}, 400);
        }
    }

    private async parseBody(response: Response): Promise<unknown> {
        if (!response.body) {
            return;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.startsWith('application/json')) {
            return await response.json();
        }

        // If not JSON, return the raw text
        return await response.text();
    }
}
