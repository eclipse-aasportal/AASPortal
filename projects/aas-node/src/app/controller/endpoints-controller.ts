/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import { inject, injectable } from 'tsyringe';
import {
    Body,
    Controller,
    Delete,
    Get,
    OperationId,
    Path,
    Post,
    Put,
    Queries,
    Route,
    Security,
    Tags,
    UploadedFile,
    UploadedFiles,
} from 'tsoa';

import { aas, AASDocument, AASEndpoint } from 'aas-core';

import { AASProvider } from '../aas-provider/aas-provider.js';
import { decodeBase64Url } from '../convert.js';

@injectable()
@Route('/api/v1/endpoints')
@Tags('Endpoints')
export class EndpointsController extends Controller {
    public constructor(@inject(AASProvider) private readonly aasProvider: AASProvider) {
        super();
    }

    /**
     * @summary Gets the endpoints.
     * @returns All current available endpoints.
     */
    @Get('')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('getEndpoints')
    public async getEndpoints(): Promise<AASEndpoint[]> {
        return await this.aasProvider.getEndpoints();
    }

    /**
     * @summary Gets the number of registered endpoints.
     * @returns The number of registered endpoints.
     */
    @Get('count')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('getCount')
    public async getCount(): Promise<{ count: number }> {
        return { count: await this.aasProvider.getEndpointCount() };
    }

    /**
     * @summary The total count of AAS documents of the specified endpoint.
     * @param endpoint The endpoint name or `undefined`.
     * @returns The total number of AAS documents.
     */
    @Get('{name}/documents/count')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('getDocumentCount')
    public async getDocumentCount(@Path() name: string): Promise<{ count: number }> {
        return { count: await this.aasProvider.getCount(decodeBase64Url(name)) };
    }

    /**
     * @summary Adds a new endpoint.
     * @param name The endpoint name.
     * @param endpoint The endpoint data.
     */
    @Post('{name}')
    @Security('bearerAuth', ['editor', 'admin'])
    @OperationId('addEndpoint')
    public async addEndpoint(@Path() name: string, @Body() endpoint: AASEndpoint): Promise<void> {
        if (decodeBase64Url(name) !== endpoint.name) {
            throw new Error('Invalid URL.');
        }

        await this.aasProvider.addEndpoint(endpoint);
    }

    /**
     * @summary Updates an existing endpoint.
     * @param name The old endpoint name.
     * @param endpoint The endpoint to update.
     */
    @Put('{name}')
    @Security('bearerAuth', ['editor', 'admin'])
    @OperationId('updateEndpoint')
    public async updateEndpoint(@Path() name: string, @Body() endpoint: AASEndpoint): Promise<void> {
        if (decodeBase64Url(name) !== endpoint.name) {
            throw new Error('Invalid URL.');
        }

        await this.aasProvider.updateEndpoint(endpoint);
    }

    /**
     * @summary Deletes the endpoint with the specified name.
     * @param name The endpoint name.
     */
    @Delete('{name}')
    @Security('bearerAuth', ['editor', 'admin'])
    @OperationId('deleteEndpoint')
    public async deleteEndpoint(@Path() name: string): Promise<void> {
        await this.aasProvider.removeEndpoint(decodeBase64Url(name));
    }

    /**
     * @summary Resets the endpoint configuration.
     */
    @Delete('')
    @Security('bearerAuth', ['editor', 'admin'])
    @OperationId('reset')
    public async reset(): Promise<void> {
        await this.aasProvider.reset();
    }

    /**
     * @summary Starts a scan of the endpoint with the specified name.
     * @param name The endpoint name (Base64-URL encoded).
     */
    @Put('{name}/scan')
    @Security('bearerAuth', ['editor', 'admin'])
    @OperationId('startEndpointScan')
    public async startEndpointScan(@Path() name: string): Promise<void> {
        await this.aasProvider.startEndpointScan(decodeBase64Url(name));
    }

    /**
     * @summary Gets the thumbnail of the specified AAS document.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The AAS identifier (Base64-URL encoded).
     * @returns The thumbnail of the current AAS document.
     */
    @Get('{endpoint}/documents/{id}/thumbnail')
    @OperationId('getThumbnail')
    public async getThumbnail(
        @Path() endpoint: string,
        @Path() id: string,
    ): Promise<NodeJS.ReadableStream | undefined> {
        return await this.aasProvider.getThumbnail(decodeBase64Url(endpoint), decodeBase64Url(id));
    }

    /**
     * @summary Downloads an AASX package from the specified endpoint.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The AAS identifier (Base64-URL encoded).
     * @returns A readable stream.
     */
    @Get('{endpoint}/packages/{id}')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('getPackage')
    public async getPackage(@Path() endpoint: string, @Path() id: string): Promise<NodeJS.ReadableStream> {
        return await this.aasProvider.getPackage(decodeBase64Url(endpoint), decodeBase64Url(id));
    }

    /**
     * @summary Uploads one or more AASX packages to the specified endpoint.
     * @param endpoint The name of the destination endpoint (Base64-URL encoded).
     * @param files The AAS package file.
     */
    @Post('{endpoint}/packages')
    @Security('bearerAuth', ['editor', 'admin'])
    @OperationId('addPackages')
    public async addPackages(@Path() endpoint: string, @UploadedFiles() files: Express.Multer.File[]): Promise<void> {
        await this.aasProvider.addPackages(decodeBase64Url(endpoint), files);
    }

    /**
     * @summary Deletes an AAS document from the specified endpoint.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The AAS identifier (Base64-URL encoded).
     */
    @Delete('{endpoint}/packages/{id}')
    @Security('bearerAuth', ['editor', 'admin'])
    @OperationId('deletePackage')
    public async deletePackage(@Path() endpoint: string, @Path() id: string): Promise<void> {
        await this.aasProvider.deletePackage(decodeBase64Url(endpoint), decodeBase64Url(id));
    }

    /**
     * @summary Downloads an AAS document from the specified endpoint.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The AAS identifier (Base64-URL encoded).
     * @returns The AAS document.
     */
    @Get('{endpoint}/documents/{id}')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('getDocument')
    public async getDocument(@Path() endpoint: string, @Path() id: string): Promise<AASDocument> {
        return await this.aasProvider.getDocument(decodeBase64Url(id), decodeBase64Url(endpoint));
    }

    /**
     * @summary Gets the content of the specified AAS document.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The AAS identifier (Base64-URL encoded).
     * @returns The AAS environment or `undefined`.
     */
    @Get('{endpoint}/documents/{id}/content')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('getDocumentContent')
    public async getDocumentContent(
        @Path() endpoint: string,
        @Path() id: string,
    ): Promise<aas.Environment | undefined> {
        return await this.aasProvider.getContent(decodeBase64Url(endpoint), decodeBase64Url(id));
    }

    /**
     * @summary Downloads the value of a Data Element.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The document or AAS identifier (Base64-URL encoded).
     * @param smId The Submodel identifier (Base64-URL encoded).
     * @param path The idShort path to the Data Element.
     * @param width The image width if the value represents an image.
     * @param height The image height if the value represenst an image.
     */
    @Get('{endpoint}/documents/{id}/submodels/{smId}/submodel-elements/{path}/value')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @Security('api_key')
    @OperationId('getDataElementValue')
    public async getDataElementValue(
        @Path() endpoint: string,
        @Path() id: string,
        @Path() smId: string,
        @Path() path: string,
        @Queries() queryParams: { width?: number; height?: number },
    ): Promise<NodeJS.ReadableStream> {
        return await this.aasProvider.getDataElementValue(
            decodeBase64Url(endpoint),
            decodeBase64Url(id),
            decodeBase64Url(smId),
            path,
            queryParams,
        );
    }

    /**
     * @summary Updates the content of an AAS document.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The document or AAS identifier (Base64-URL encoded).
     * @param file The new document content.
     * @returns The messages of the update process.
     */
    @Put('{endpoint}/documents/{id}')
    @Security('bearerAuth', ['editor', 'admin'])
    @OperationId('updateDocument')
    public async updateDocument(
        @Path() endpoint: string,
        @Path() id: string,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<string[]> {
        const buffer = await fs.promises.readFile(file.path);
        const env: aas.Environment = JSON.parse(buffer.toString());
        return await this.aasProvider.updateDocument(decodeBase64Url(endpoint), decodeBase64Url(id), env);
    }

    /**
     * @summary Invokes an Operation synchronously.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The document dentifier (Base64-URL encoded).
     * @param operation The `Operation`.
     * @returns The executed `Operation`.
     */
    @Post('{endpoint}/documents/{id}/invoke')
    @Security('bearerAuth', ['editor', 'admin'])
    @OperationId('invokeOperation')
    public async invokeOperation(
        @Path() endpoint: string,
        @Path() id: string,
        @Body() operation: aas.Operation,
    ): Promise<aas.Operation> {
        return await this.aasProvider.invoke(decodeBase64Url(endpoint), decodeBase64Url(id), operation);
    }

    /**
     * @summary Gets the content of the specified AAS document.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The AAS identifier (Base64-URL encoded).
     * @returns The AAS environment or `undefined`.
     */
    @Get('{endpoint}/documents/{id}/hierarchy')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('getHierarchy')
    public async getHierarchy(@Path() endpoint: string, @Path() id: string): Promise<AASDocument[]> {
        return await this.aasProvider.getHierarchy(decodeBase64Url(endpoint), decodeBase64Url(id));
    }
}
