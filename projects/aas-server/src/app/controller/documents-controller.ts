/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Get, OperationId, Route, Security, Tags } from 'tsoa';
import { Logger } from '../logging/logger.js';
import { ControllerBase } from './controller-base.js';
import { AuthService } from '../auth/auth-service.js';
import { Variable } from '../variable.js';
import { AASDocument } from 'common';
import { AASProvider } from '../aas-provider/aas-provider.js';
import { decodeBase64Url } from '../convert.js';

@injectable()
@Route('/api/v1/documents')
@Tags('Documents')
export class DocumentsController extends ControllerBase {
    constructor(
        @inject('Logger') logger: Logger,
        @inject(AuthService) auth: AuthService,
        @inject(Variable) variable: Variable,
        @inject(AASProvider) private readonly aasProvider: AASProvider
    ) {
        super(logger, auth, variable);
    }

    /**
     * Gets the first occurrence of an AAS document with the specified identifier.
     * @param id The AAS identifier.
     * @returns The first occurrence of an AAS document with the specified identifier.
     */
    @Get('{id}')
    @Security('bearerAuth', ['guest'])
    @OperationId('getDocument')
    public async getDocument(id: string): Promise<AASDocument> {
        try {
            this.logger.start('getWorkspaces');
            return await Promise.resolve(this.aasProvider.getDocument(decodeBase64Url(id)));
        } finally {
            this.logger.stop();
        }
    }
}