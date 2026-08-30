/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import express from 'express';
import {
    Body,
    Controller,
    Get,
    OperationId,
    Path,
    Post,
    Put,
    Queries,
    Query,
    Request,
    Route,
    Security,
    Tags,
} from 'tsoa';

import { aas, AASDocument, AASPagedResult } from 'aas-core';
import { decodeBase64Url } from 'aas-package';
import { DocumentProvider } from '../provider/document-provider.js';
import { AASIndexClient } from '../index/aas-index-client.js';

@injectable()
@Route('/api/v1')
@Tags('Documents')
export class DocumentsController extends Controller {
    public constructor(
        @inject(DocumentProvider) private readonly provider: DocumentProvider,
        @inject(AASIndexClient) private readonly index: AASIndexClient,
    ) {
        super();
    }

    /**
     * @summary Returns a limited number of AAS documents from a given position. Limit and position are stored in a cursor object.
     * @param cursor The current cursor.
     * @param filter A filter expression.
     * @param language The filter expression language.
     * @returns A page of AAS documents.
     */
    @Get('documents')
    @OperationId('getDocuments')
    public async getDocuments(
        @Query() cursor: string,
        @Query() filter?: string,
        @Query() language?: string,
    ): Promise<AASPagedResult> {
        if (filter) {
            filter = decodeBase64Url(filter);
        }

        return await this.index.getDocuments(JSON.parse(decodeBase64Url(cursor)), filter, language);
    }

    /**
     * @summary Gets the first occurrence of an AAS document with the specified identifier.
     * @param id The AAS identifier.
     * @returns The first occurrence of an AAS document with the specified identifier.
     */
    @Get('documents/{id}')
    @OperationId('getDocument')
    public async getDocument(@Path() id: string, @Request() req: express.Request): Promise<AASDocument> {
        return await this.provider.getDocument(
            undefined,
            'AssetAdministrationShell',
            decodeBase64Url(id),
            req.session?.endpoints,
        );
    }

    /**
     * @summary Gets the AAS document that provides an Asset with the specified identifier.
     * @param id The Asset identifier (Base64-URL encoded).
     * @returns The AAS document
     */
    @Get('documents/assets/{id}')
    @OperationId('getDocumentByAsset')
    public async getDocumentByAsset(@Path() id: string, @Request() req: express.Request): Promise<AASDocument> {
        return await this.provider.getDocument(undefined, 'Asset', decodeBase64Url(id), req.session?.endpoints);
    }

    /**
     * @summary Gets the thumbnail of the specified AAS document.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The AAS identifier (Base64-URL encoded).
     * @returns The thumbnail of the current AAS document.
     */
    @Get('endpoints/{endpoint}/documents/{id}/thumbnail')
    @OperationId('getThumbnail')
    public async getThumbnail(
        @Path() endpoint: string,
        @Path() id: string,
        @Request() req: express.Request,
    ): Promise<NodeJS.ReadableStream | undefined> {
        endpoint = decodeBase64Url(endpoint);
        return await this.provider.getThumbnail(
            endpoint,
            decodeBase64Url(id),
            req.session?.endpoints?.find(item => item.name === endpoint)?.headers,
        );
    }

    /**
     * @summary Gets an AAS document that provides an AAS with the specified identifier from the given endpoint.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The AAS identifier (Base64-URL encoded).
     * @returns The AAS document.
     */
    @Get('endpoints/{endpoint}/documents/{id}')
    @OperationId('getDocumentFromEndpoint')
    public async getDocumentFromEndpoint(
        @Path() endpoint: string,
        @Path() id: string,
        @Request() req: express.Request,
    ): Promise<AASDocument> {
        endpoint = decodeBase64Url(endpoint);
        return await this.provider.getDocument(
            endpoint,
            'AssetAdministrationShell',
            decodeBase64Url(id),
            req.session?.endpoints ?? [],
        );
    }

    /**
     * @summary Gets the AAS document that provides an Asset with the specified identifier from the specified endpoint.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The Asset identifier (Base64-URL encoded).
     * @returns The AAS document
     */
    @Get('endpoints/{endpoint}/documents/assets/{id}')
    @OperationId('getDocumentFromEndpointByAsset')
    public async getDocumentFromEndpointByAsset(
        @Path() endpoint: string,
        @Path() id: string,
        @Request() req: express.Request,
    ): Promise<AASDocument> {
        return await this.provider.getDocument(
            decodeBase64Url(endpoint),
            'Asset',
            decodeBase64Url(id),
            req.session?.endpoints ?? [],
        );
    }

    /**
     * @summary Downloads the value of a Data Element.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The document or AAS identifier (Base64-URL encoded).
     * @param smId The Submodel identifier (Base64-URL encoded).
     * @param path The idShort path to the Data Element.
     * @param queryParams The required image `width` and or `height`.
     */
    @Get('endpoints/{endpoint}/documents/{id}/submodels/{smId}/submodel-elements/{path}/value')
    @OperationId('getDataElementValue')
    public async getDataElementValue(
        @Path() endpoint: string,
        @Path() id: string,
        @Path() smId: string,
        @Path() path: string,
        @Queries() queryParams: { width?: number; height?: number },
        @Request() req: express.Request,
    ): Promise<NodeJS.ReadableStream> {
        endpoint = decodeBase64Url(endpoint);
        return await this.provider.getDataElementValue(
            endpoint,
            decodeBase64Url(id),
            decodeBase64Url(smId),
            path,
            req.session?.endpoints?.find(item => item.name === endpoint)?.headers,
            queryParams,
        );
    }

    /**
     * @summary Updates the content of an AAS document.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The document or AAS identifier (Base64-URL encoded).
     * @param env The ASS environment containing the modified elements.
     * @returns The messages of the update process.
     */
    @Put('endpoints/{endpoint}/documents/{id}')
    @Security('oauth2', ['user', 'admin'])
    @OperationId('updateDocument')
    public async updateDocument(
        @Path() endpoint: string,
        @Path() id: string,
        @Body() env: aas.Environment,
        @Request() req: express.Request,
    ): Promise<void> {
        endpoint = decodeBase64Url(endpoint);
        await this.provider.updateDocument(
            endpoint,
            decodeBase64Url(id),
            env,
            req.session?.endpoints?.find(item => item.name === endpoint)?.headers,
        );
    }

    /**
     * @summary Invokes an Operation synchronously.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The document identifier (Base64-URL encoded).
     * @param operation The `Operation`.
     * @returns The executed `Operation`.
     */
    @Post('endpoints/{endpoint}/documents/{id}/invoke')
    @Security('oauth2', ['user', 'admin'])
    @OperationId('invokeOperation')
    public async invokeOperation(
        @Path() endpoint: string,
        @Path() id: string,
        @Body() operation: aas.Operation,
        @Request() req: express.Request,
    ): Promise<aas.Operation> {
        endpoint = decodeBase64Url(endpoint);
        return await this.provider.invoke(
            endpoint,
            decodeBase64Url(id),
            operation,
            req.session?.endpoints?.find(item => item.name === endpoint)?.headers,
        );
    }
}
