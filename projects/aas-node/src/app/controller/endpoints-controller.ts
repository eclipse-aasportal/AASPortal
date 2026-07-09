/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import {
    Body,
    Controller,
    Delete,
    Get,
    OperationId,
    Patch,
    Path,
    Post,
    Put,
    Request,
    Route,
    Security,
    Tags,
} from 'tsoa';
import express from 'express';

import { ApplicationError, EndpointAuth, type AASEndpoint } from 'aas-core';
import { decodeBase64Url } from 'aas-package';

import { AAS_INDEX, AASIndex } from '../index/aas-index.js';
import { EndpointProvider } from '../provider/endpoint-provider.js';
import { ERRORS } from '../errors.js';
import { COOKIE_STORAGE, CookieStorage } from '../cookie-storage/cookie-storage.js';

@injectable()
@Route('/api/v1/endpoints')
@Tags('Endpoints')
export class EndpointsController extends Controller {
    public constructor(
        @inject(EndpointProvider) private readonly provider: EndpointProvider,
        @inject(COOKIE_STORAGE) private readonly cookieStorage: CookieStorage,
        @inject(AAS_INDEX) private readonly index: AASIndex,
    ) {
        super();
    }

    /**
     * @summary Gets the endpoints.
     * @returns All current available endpoints.
     */
    @Get('')
    @Security('oauth2', ['reader', 'editor', 'admin'])
    @OperationId('getEndpoints')
    public async getEndpoints(): Promise<AASEndpoint[]> {
        return (await this.index.getEndpoints()).map(endpoint => {
            if (endpoint.headers) {
                const headers: Record<string, string> = {};
                for (const key in endpoint.headers) {
                    headers[key] = '*****';
                }

                return { ...endpoint, headers };
            }

            return endpoint;
        });
    }

    /**
     * @summary Gets the number of registered endpoints.
     * @returns The number of registered endpoints.
     */
    @Get('count')
    @OperationId('getCount')
    public async getCount(): Promise<{ count: number }> {
        return { count: await this.index.getEndpointCount() };
    }

    /**
     * @summary The total count of AAS documents over all endpoints.
     * @returns The total count of AAS documents.
     */
    @Get('documents-count')
    @OperationId('getDocumentCount')
    public async getDocumentCount(): Promise<{ count: number }> {
        return { count: await this.index.getCount() };
    }

    /**
     * @summary The total number of AAS documents of the specified endpoint.
     * @param name The endpoint name.
     * @returns The total number of AAS documents.
     */
    @Get('{name}/documents-count')
    @OperationId('getEndpointDocumentCount')
    public async getEndpointDocumentCount(@Path() name: string): Promise<{ count: number }> {
        return { count: await this.index.getCount(decodeBase64Url(name)) };
    }

    /**
     * @summary Adds a new endpoint.
     * @param endpoint The endpoint data.
     */
    @Post('')
    @Security('oauth2', ['editor', 'admin'])
    @OperationId('addEndpoint')
    public async addEndpoint(@Body() endpoint: AASEndpoint): Promise<void> {
        await this.provider.addEndpoint(endpoint);
    }

    /**
     * @summary Updates an existing endpoint.
     * @param name The endpoint name.
     * @param endpoint The new endpoint data.
     */
    @Put('{name}')
    @Security('oauth2', ['editor', 'admin'])
    @OperationId('updateEndpoint')
    public async updateEndpoint(@Path() name: string, @Body() endpoint: AASEndpoint): Promise<void> {
        if (decodeBase64Url(name) !== endpoint.name) {
            throw new Error('Endpoint name cannot be changed.');
        }

        await this.provider.updateEndpoint(endpoint);
    }

    /**
     * @summary Deletes the endpoint with the specified name.
     * @param name The endpoint name.
     */
    @Delete('{name}')
    @Security('oauth2', ['editor', 'admin'])
    @OperationId('deleteEndpoint')
    public async deleteEndpoint(@Path() name: string): Promise<void> {
        await this.provider.removeEndpoint(decodeBase64Url(name));
    }

    /**
     * @summary Resets the endpoint configuration.
     */
    @Delete('')
    @Security('oauth2', ['editor', 'admin'])
    @OperationId('reset')
    public async reset(): Promise<void> {
        await this.provider.reset();
    }

    /**
     * @summary Starts a scan of the endpoint with the specified name.
     * @param name The endpoint name (Base64-URL encoded).
     */
    @Put('{name}/scan')
    @Security('oauth2', ['editor', 'admin'])
    @OperationId('startEndpointScan')
    public async startEndpointScan(@Path() name: string): Promise<void> {
        await this.provider.startEndpointScan(decodeBase64Url(name));
    }

    /**
     * @summary Gets the authentication information for all endpoints of the current authenticated user.
     * @returns The authentication information for all endpoints of the current authenticated user.
     */
    @Get('auth')
    @OperationId('getAllEndpointAuth')
    public async getAllEndpointAuth(@Request() req: express.Request): Promise<EndpointAuth[]> {
        const user = req.user;
        if (!user) {
            throw new ApplicationError(ERRORS.UNAUTHORIZED, {}, 401);
        }

        return (await this.cookieStorage.getEndpoints(user.id)).map(endpoint => {
            if (endpoint.headers) {
                const headers: Record<string, string> = {};
                for (const key in endpoint.headers) {
                    headers[key] = '*****';
                }

                return { ...endpoint, headers };
            }

            return endpoint;
        });
    }

    /**
     * @summary Updates the authentication information of the specified endpoints for the current authenticated user.
     * @param items The updated endpoint authentication information.
     */
    @Patch('auth')
    @OperationId('updateEndpointAuthItems')
    public async updateEndpointAuthItems(
        @Body() items: EndpointAuth[],
        @Request() req: express.Request,
    ): Promise<void> {
        const user = req.user;
        if (!user) {
            throw new ApplicationError(ERRORS.UNAUTHORIZED, {}, 401);
        }

        await this.cookieStorage.updatesEndpoints(user.id, items);
    }
}
