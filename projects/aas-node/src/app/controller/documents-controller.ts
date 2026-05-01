/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Controller, Get, OperationId, Path, Query, Route, Tags } from 'tsoa';
import { AASDocument, AASPagedResult } from 'aas-core';
import { decodeBase64Url } from 'aas-package';
import { AASProvider } from '../provider/aas-provider.js';

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
     * @param language The filter expression language.
     * @returns A page of AAS documents.
     */
    @Get('')
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
     * The total count of AAS documents over all endpoints.
     * @returns The total count of AAS documents.
     */
    @Get('count')
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
    @OperationId('getDocument')
    public async getDocument(@Path() id: string): Promise<AASDocument> {
        return await this.aasProvider.getDocument(undefined, 'AssetAdministrationShell', decodeBase64Url(id));
    }

    /**
     * @summary Gets the AAS document that provides an Asset with the specified identifier from the specified endpoint.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The Asset identifier (Base64-URL encoded).
     * @returns The AAS document
     */
    @Get('asset/{id}')
    @OperationId('getDocumentByAsset')
    public async getDocumentByAsset(@Path() id: string): Promise<AASDocument> {
        return await this.aasProvider.getDocument(undefined, 'Asset', decodeBase64Url(id));
    }
}
