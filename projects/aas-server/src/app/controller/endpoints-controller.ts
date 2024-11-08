/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Body, Delete, Get, OperationId, Path, Post, Put, Route, Security, Tags } from 'tsoa';
import { AASEndpoint } from 'aas-core';

import { AASProvider } from '../aas-provider/aas-provider.js';
import { AuthService } from '../auth/auth-service.js';
import { Logger } from '../logging/logger.js';
import { AASController } from './aas-controller.js';
import { Variable } from '../variable.js';
import { decodeBase64Url } from '../convert.js';

@injectable()
@Route('/api/v1/endpoints')
@Tags('Endpoints')
export class EndpointsController extends AASController {
    public constructor(
        @inject('Logger') logger: Logger,
        @inject(AuthService) auth: AuthService,
        @inject(Variable) variable: Variable,
        @inject(AASProvider) private readonly aasProvider: AASProvider,
    ) {
        super(logger, auth, variable);
    }

    /**
     * @summary Gets the endpoints.
     * @returns All current available endpoints.
     */
    @Get('')
    @Security('bearerAuth', ['guest'])
    @OperationId('getEndpoints')
    public async getEndpoints(): Promise<AASEndpoint[]> {
        try {
            this.logger.start('getEndpoints');
            return await this.aasProvider.getEndpoints();
        } finally {
            this.logger.stop();
        }
    }

    /**
     * @summary Gets the number of registered endpoints.
     * @returns The number of registered endpoints.
     */
    @Get('count')
    @Security('bearerAuth', ['guest'])
    @OperationId('getCount')
    public async getCount(): Promise<{ count: number }> {
        try {
            this.logger.start('getEndpointCount');
            return { count: await this.aasProvider.getEndpointCount() };
        } finally {
            this.logger.stop();
        }
    }

    /**
     * @summary The total count of AAS documents of the specified endpoint.
     * @param endpoint The endpoint name or `undefined`.
     * @returns The total number of AAS documents.
     */
    @Get('{name}/documents/count')
    @Security('bearerAuth', ['guest'])
    @OperationId('getEndpointCount')
    public async getEndpointCount(@Path() name: string): Promise<{ count: number }> {
        try {
            this.logger.start('getCount');
            return { count: await this.aasProvider.getCountAsync(decodeBase64Url(name)) };
        } finally {
            this.logger.stop();
        }
    }

    /**
     * @summary Adds a new endpoint to the AASServer container configuration.
     * @param name The endpoint name.
     * @param endpoint The endpoint URL.
     */
    @Post('{name}')
    @Security('bearerAuth', ['editor'])
    @OperationId('addEndpoint')
    public async addEndpoint(@Path() name: string, @Body() endpoint: AASEndpoint): Promise<void> {
        try {
            this.logger.start('addEndpoint');
            await this.aasProvider.addEndpointAsync(decodeBase64Url(name), endpoint);
        } finally {
            this.logger.stop();
        }
    }

    /**
     * @summary Updates an existing endpoint.
     * @param name The old endpoint name.
     * @param endpoint The endpoint to update.
     */
    @Put('{name}')
    @Security('bearerAuth', ['editor'])
    @OperationId('updateEndpoint')
    public async updateEndpoint(@Path() name: string, @Body() endpoint: AASEndpoint): Promise<void> {
        try {
            this.logger.start('addEndpoint');
            await this.aasProvider.updateEndpointAsync(decodeBase64Url(name), endpoint);
        } finally {
            this.logger.stop();
        }
    }

    /**
     * @summary Deletes the endpoint with the specified name from the AASServer container configuration.
     * @param name The endpoint name.
     */
    @Delete('{name}')
    @Security('bearerAuth', ['editor'])
    @OperationId('deleteEndpoint')
    public async deleteEndpoint(@Path() name: string): Promise<void> {
        try {
            this.logger.start('removeEndpoint');
            await this.aasProvider.removeEndpointAsync(decodeBase64Url(name));
        } finally {
            this.logger.stop();
        }
    }

    /**
     * @summary Resets the AASServer container configuration.
     */
    @Delete('')
    @Security('bearerAuth', ['editor'])
    @OperationId('reset')
    public async reset(): Promise<void> {
        try {
            this.logger.start('reset');
            await this.aasProvider.resetAsync();
        } finally {
            this.logger.stop();
        }
    }
}
