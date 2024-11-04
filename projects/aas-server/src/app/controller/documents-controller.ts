/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Get, OperationId, Query, Route, Security, Tags } from 'tsoa';
import { Logger } from '../logging/logger.js';
import { AASController } from './aas-controller.js';
import { AuthService } from '../auth/auth-service.js';
import { Variable } from '../variable.js';
import { AASDocument, AASPagedResult } from 'aas-core';
import { AASProvider } from '../aas-provider/aas-provider.js';
import { decodeBase64Url } from '../convert.js';

@injectable()
@Route('/api/v1/documents')
@Tags('Documents')
export class DocumentsController extends AASController {
    public constructor(
        @inject('Logger') logger: Logger,
        @inject(AuthService) auth: AuthService,
        @inject(Variable) variable: Variable,
        @inject(AASProvider) private readonly aasProvider: AASProvider,
    ) {
        super(logger, auth, variable);
    }

    /**
     * Returns a limited number of AAS documents from a given position. Limit and position are stored in a cursor object.
     * @param cursor The current cursor.
     * @param filter A filter expression.
     * @returns A page of AAS documents.
     */
    @Get('')
    @Security('bearerAuth', ['guest'])
    @OperationId('getDocuments')
    public async getDocuments(
        @Query() cursor: string,
        @Query() filter?: string,
        @Query() language?: string,
    ): Promise<AASPagedResult> {
        try {
            this.logger.start('getDocuments');
            if (filter) {
                filter = decodeBase64Url(filter);
            }

            return await this.aasProvider.getDocumentsAsync(JSON.parse(decodeBase64Url(cursor)), filter, language);
        } finally {
            this.logger.stop();
        }
    }

    @Get('count')
    @Security('bearerAuth', ['guest'])
    @OperationId('getDocumentCount')
    public async getDocumentCount(@Query() filter?: string): Promise<number> {
        try {
            this.logger.start('getDocuments');
            if (filter) {
                filter = decodeBase64Url(filter);
            }

            return await this.aasProvider.getDocumentCountAsync(filter);
        } finally {
            this.logger.stop();
        }
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
            this.logger.start('getDocument');
            return await this.aasProvider.getDocumentAsync(decodeBase64Url(id));
        } finally {
            this.logger.stop();
        }
    }
}
