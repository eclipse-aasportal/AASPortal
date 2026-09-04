/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Controller, Delete, Get, OperationId, Path, Post, Request, Route, Security, Tags, UploadedFile } from 'tsoa';
import express from 'express';
import { decodeBase64Url } from 'aas-package';

import { PackageProvider } from '../provider/package-provider.js';

@injectable()
@Route('/api/v1/endpoints')
@Tags('Packages')
export class PackagesController extends Controller {
    public constructor(@inject(PackageProvider) private readonly service: PackageProvider) {
        super();
    }

    /**
     * @summary Downloads an AASX package from the specified endpoint.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The AAS identifier (Base64-URL encoded).
     * @returns A readable stream.
     */
    @Get('{endpoint}/packages/{id}')
    @Security('oauth2', ['reader', 'user', 'admin'])
    @OperationId('getPackage')
    public async getPackage(
        @Path() endpoint: string,
        @Path() id: string,
        @Request() req: express.Request,
    ): Promise<NodeJS.ReadableStream> {
        const headers = req.session?.endpoints?.find(item => item.name === endpoint)?.headers;
        return await this.service.getPackage(decodeBase64Url(endpoint), decodeBase64Url(id), headers);
    }

    /**
     * @summary Inserts an AASX packages to the specified endpoint.
     * @param endpoint The name of the destination endpoint (Base64-URL encoded).
     * @param file The AASX package file.
     */
    @Post('{endpoint}/packages')
    @Security('oauth2', ['user', 'admin'])
    @OperationId('insertPackages')
    public async insertPackages(
        @Path() endpoint: string,
        @UploadedFile() file: Express.Multer.File,
        @Request() req: express.Request,
    ): Promise<void> {
        const headers = req.session?.endpoints?.find(item => item.name === endpoint)?.headers;
        await this.service.insertPackages(decodeBase64Url(endpoint), file, headers);
    }

    /**
     * @summary Deletes an AASX package from the specified endpoint.
     * @param endpoint The endpoint name (Base64-URL encoded).
     * @param id The AAS identifier (Base64-URL encoded).
     */
    @Delete('{endpoint}/packages/{id}')
    @Security('oauth2', ['user', 'admin'])
    @OperationId('deletePackage')
    public async deletePackage(
        @Path() endpoint: string,
        @Path() id: string,
        @Request() req: express.Request,
    ): Promise<void> {
        const headers = req.session?.endpoints?.find(item => item.name === endpoint)?.headers;
        await this.service.deletePackage(decodeBase64Url(endpoint), decodeBase64Url(id), headers);
    }
}
