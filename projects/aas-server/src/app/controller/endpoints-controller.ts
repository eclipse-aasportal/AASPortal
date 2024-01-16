/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Body, Delete, Get, OperationId, Path, Post, Route, Security, Tags } from 'tsoa';
import { AASEndpoint } from 'common';

import { AASProvider } from '../aas-provider/aas-provider.js';
import { AuthService } from '../auth/auth-service.js';
import { Logger } from '../logging/logger.js';
import { AASController } from './aas-controller.js';
import { Variable } from '../variable.js';

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
            this.logger.start('getWorkspaces');
            return await this.aasProvider.getEndpoints();
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
    public addEndpoint(@Path() name: string, @Body() endpoint: AASEndpoint): Promise<void> {
        return this.aasProvider.addEndpointAsync(name, endpoint);
    }

    /**
     * @summary Deletes the endpoint with the specified name from the AASServer container configuration.
     * @param name The endpoint name.
     */
    @Delete('{name}')
    @Security('bearerAuth', ['editor'])
    @OperationId('deleteEndpoint')
    public deleteEndpoint(@Path() name: string): Promise<void> {
        return this.aasProvider.removeEndpointAsync(name);
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
