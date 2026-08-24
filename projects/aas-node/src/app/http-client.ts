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
 * HTTP client with request timeouts. GET requests are retried.
 */
@singleton()
export class HttpClient {
    private readonly DEFAULT_TIMEOUT_MS = 5000;

    /**
     * Gets a JSON response.
     * @param url Request URL.
     * @param headers Request headers.
     * @returns Parsed JSON response.
     */
    public async get<T = unknown>(url: URL, headers?: Record<string, string>): Promise<T> {
        const response = await this.retryableRequest(() => this.fetchWithTimeout(url.href, { method: 'GET', headers }));
        await this.handleResponse(response, 'GET');
        return await this.parseJson(response);
    }

    /**
     * Gets a response body as a Node.js readable stream.
     * @param url Request URL.
     * @param headers Request headers.
     * @returns Response body stream.
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
     * Sends a JSON PUT request.
     * @param url Request URL.
     * @param data JSON request body.
     * @param headers Request headers.
     * @returns Parsed response body.
     */
    public async put<T = unknown>(url: URL, data: unknown, headers?: Record<string, string>): Promise<T> {
        const response = await this.fetchWithTimeout(url.href, {
            method: 'PUT',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        await this.handleResponse(response, 'PUT');
        return this.parseBody(response) as T;
    }

    /**
     * Sends a JSON POST request.
     * @param url Request URL.
     * @param data JSON request body.
     * @param headers Request headers.
     * @returns Parsed response body.
     */
    public async post<T = unknown>(url: URL, data: unknown, headers?: Record<string, string>): Promise<T> {
        const response = await this.fetchWithTimeout(url.href, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        await this.handleResponse(response, 'POST');
        return this.parseBody(response) as T;
    }

    /**
     * Sends a multipart POST request.
     * @param url Request URL.
     * @param formData Multipart request body.
     * @param headers Request headers.
     * @returns Parsed response body.
     */
    public async postFormData<T = unknown>(url: URL, formData: FormData, headers?: Record<string, string>): Promise<T> {
        const response = await this.fetchWithTimeout(url.href, {
            method: 'POST',
            headers,
            body: formData,
        });

        await this.handleResponse(response, 'POST');
        return this.parseBody(response) as T;
    }

    /**
     * Deletes a resource.
     * @param url Request URL.
     * @param headers Request headers.
     */
    public async delete(url: URL, headers?: Record<string, string>): Promise<void> {
        const response = await this.fetchWithTimeout(url.href, {
            method: 'DELETE',
            headers,
        });

        await this.handleResponse(response, 'DELETE');
    }

    /**
     * Checks an endpoint with a HEAD request.
     * @param url Request URL.
     * @param headers Request headers.
     * @param timeoutMs Request timeout in milliseconds.
     */
    public async checkUrlExist(url: string, timeoutMs?: number): Promise<void>;
    public async checkUrlExist(url: string, headers?: Record<string, string>, timeoutMs?: number): Promise<void>;
    public async checkUrlExist(
        url: string,
        headersOrTimeout?: Record<string, string> | number,
        timeoutMs: number = 5000,
    ): Promise<void> {
        const headers = typeof headersOrTimeout === 'number' ? undefined : headersOrTimeout;
        const effectiveTimeoutMs = typeof headersOrTimeout === 'number' ? headersOrTimeout : timeoutMs;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), effectiveTimeoutMs);

        try {
            const response = await fetch(url, {
                method: 'HEAD',
                headers,
                signal: controller.signal,
            });

            await this.handleResponse(response, 'HEAD');
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }

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
                    await response.body?.cancel().catch(() => undefined);
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
        if (!this.isJsonContentType(contentType)) {
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
        if (this.isJsonContentType(contentType)) {
            return await response.json();
        }

        // If not JSON, return the raw text
        return await response.text();
    }

    private isJsonContentType(contentType: string | null): boolean {
        const mediaType = contentType?.split(';', 1)[0].trim().toLowerCase();
        return mediaType === 'application/json' || !!mediaType?.match(/^application\/.+\+json$/);
    }
}
