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

import { UpdateIndexStatus, ApplicationError, AASEndpointAuth, type AASEndpoint } from 'aas-core';
import { decodeBase64Url } from 'aas-package';

import { EndpointProvider } from '../provider/endpoint-provider.js';
import { ERRORS } from '../errors.js';
import { COOKIE_STORE, CookieStorage } from '../cookie-storage/cookie-storage.js';
import { AASIndexClient } from '../index/aas-index-client.js';

@injectable()
@Route('/api/v1/endpoints')
@Tags('Endpoints')
export class EndpointsController extends Controller {
    public constructor(
        @inject(EndpointProvider) private readonly provider: EndpointProvider,
        @inject(COOKIE_STORE) private readonly cookieStorage: CookieStorage,
        @inject(AASIndexClient) private readonly index: AASIndexClient,
    ) {
        super();
    }

    /**
     * @summary Gets the endpoints.
     * @returns All current available endpoints.
     */
    @Get('')
    @Security('oauth2', ['reader', 'editor', 'admin'])
    @OperationId('GetEndpoints')
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
    @Get('endpoint-count')
    @OperationId('GetEndpointCount')
    public async getEndpointCount(): Promise<number> {
        return await this.index.getEndpointCount();
    }

    /**
     * @summary The total count of AAS documents over all endpoints.
     * @returns The total count of AAS documents.
     */
    @Get('document-count')
    @OperationId('GetDocumentCount')
    public async getDocumentCount(): Promise<number> {
        return await this.index.getDocumentCount();
    }

    /**
     * @summary The total number of AAS documents of the specified endpoint.
     * @param name The endpoint name.
     * @returns The total number of AAS documents.
     */
    @Get('{name}/document-count')
    @OperationId('GetEndpointDocumentCount')
    public async getEndpointDocumentCount(@Path() name: string): Promise<number> {
        return await this.index.getDocumentCount(decodeBase64Url(name));
    }

    /**
     * @summary Adds a new endpoint.
     * @param endpoint The endpoint data.
     */
    @Post('')
    @Security('oauth2', ['editor', 'admin'])
    @OperationId('AddEndpoint')
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
    @OperationId('UpdateEndpoint')
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
    @OperationId('DeleteEndpoint')
    public async deleteEndpoint(@Path() name: string): Promise<void> {
        await this.provider.removeEndpoint(decodeBase64Url(name));
    }

    /**
     * @summary Starts a scan of the endpoint with the specified name.
     * @param name The endpoint name (Base64-URL encoded).
     */
    @Put('{name}/start-scan')
    @Security('oauth2', ['editor', 'admin'])
    @OperationId('StartEndpointScan')
    public async startEndpointScan(@Path() name: string): Promise<void> {
        await this.provider.startEndpointScan(decodeBase64Url(name));
    }

    /**
     * @summary Cancels a running scan of the endpoint with the specified name.
     * @param name The endpoint name (Base64-URL encoded).
     */
    @Put('{name}/cancel-scan')
    @Security('oauth2', ['editor', 'admin'])
    @OperationId('CancelEndpointScan')
    public async cancelEndpointScan(@Path() name: string): Promise<void> {
        await this.provider.cancelEndpointScan(decodeBase64Url(name));
    }

    /**
     * @summary Gets the authentication information for all endpoints of the current authenticated user.
     * @returns The authentication information for all endpoints of the current authenticated user.
     */
    @Get('auth')
    @OperationId('GetAllEndpointAuth')
    public async getAllEndpointAuth(@Request() req: express.Request): Promise<AASEndpointAuth[]> {
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
    @OperationId('UpdateEndpointAuthItems')
    public async updateEndpointAuthItems(
        @Body() items: AASEndpointAuth[],
        @Request() req: express.Request,
    ): Promise<void> {
        const user = req.user;
        if (!user) {
            throw new ApplicationError(ERRORS.UNAUTHORIZED, {}, 401);
        }

        await this.cookieStorage.updatesEndpoints(user.id, items);
    }

    /**
     * Gets the scan status of the AAS endpoint with the specified name.
     * @param name The name of the AAS endpoint.
     * @returns The scan status of the AAS endpoint.
     */
    @Get('{name}/status')
    @OperationId('GetUpdateStatus')
    public async getUpdateStatus(@Path() name: string): Promise<UpdateIndexStatus> {
        return this.provider.getUpdateStatus(decodeBase64Url(name));
    }
}
