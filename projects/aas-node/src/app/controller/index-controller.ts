/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Controller, Delete, OperationId, Path, Route, Security, Tags } from 'tsoa';

import { decodeBase64Url } from 'aas-package';

import { EndpointProvider } from '../provider/endpoint-provider.js';

@injectable()
@Route('/api/v1/index')
@Tags('Endpoints')
export class IndexController extends Controller {
    public constructor(@inject(EndpointProvider) private readonly provider: EndpointProvider) {
        super();
    }

    /**
     * @summary Clears the index fro all AAS endpoints.
     */
    @Delete('clear-index')
    @Security('oauth2', ['admin'])
    @OperationId('ClearIndex')
    public async clearIndex(): Promise<void> {
        await this.provider.clearIndex();
    }

    /**
     * @summary Clears the index of the AAS endpoint with the specified name.
     * @param name The endpoint name (Base64-URL encoded).
     */
    @Delete('{name}/clear-index')
    @Security('oauth2', ['admin'])
    @OperationId('ClearEndpointIndex')
    public async clearEndpointIndex(@Path() name: string): Promise<void> {
        await this.provider.clearIndex(decodeBase64Url(name));
    }
}
