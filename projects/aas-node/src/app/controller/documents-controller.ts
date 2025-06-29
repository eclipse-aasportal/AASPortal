/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Controller, Get, OperationId, Path, Query, Route, Security, Tags } from 'tsoa';
import { AASDocument, AASPagedResult } from 'aas-core';
import { AASProvider } from '../aas-provider/aas-provider.js';
import { decodeBase64Url } from '../convert.js';

@injectable()
@Route('/api/v1/documents')
@Tags('Documents')
export class DocumentsController extends Controller {
    public constructor(@inject(AASProvider) private readonly aasProvider: AASProvider) {
        super();
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
        if (filter) {
            filter = decodeBase64Url(filter);
        }

        return await this.aasProvider.getDocuments(JSON.parse(decodeBase64Url(cursor)), filter, language);
    }

    /**
     * The total count of AAS documents over all endpoints or a specified endpoint.
     * @param endpoint The endpoint name or `undefined`.
     * @returns The total number of AAS documents.
     */
    @Get('count')
    @Security('bearerAuth', ['guest'])
    @OperationId('getCount')
    public async getCount(): Promise<{ count: number }> {
        return { count: await this.aasProvider.getCount() };
    }

    /**
     * Gets the first occurrence of an AAS document with the specified identifier.
     * @param id The AAS identifier.
     * @returns The first occurrence of an AAS document with the specified identifier.
     */
    @Get('{id}')
    @Security('bearerAuth', ['guest'])
    @OperationId('getDocument')
    public async getDocument(@Path() id: string): Promise<AASDocument> {
        return await this.aasProvider.getDocument(decodeBase64Url(id));
    }
}
