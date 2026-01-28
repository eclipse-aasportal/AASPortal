/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import {
    Controller,
    Delete,
    Get,
    OperationId,
    Path,
    Post,
    Put,
    Query,
    Route,
    Security,
    SuccessResponse,
    Tags,
    UploadedFile,
} from 'tsoa';

import { noop, PackageDescription, PagedResult } from 'aas-core';

import { decodeBase64Url } from '../utilities.js';
import { PackageRepository } from '../package-repository.js';

/**
 * @summary AASX File Server Interface.
 */
@injectable()
@Route('/packages')
@Tags('AASX File Server Interface')
export class PackagesController extends Controller {
    public constructor(@inject(PackageRepository) private readonly repository: PackageRepository) {
        super();
    }

    /**
     * @summary Returns a list of available AASX packages at the server.
     * @param limit The maximum size of the result set.
     * @param cursor The position from which to resume a result listing.
     * @param aasId Identifier of the AAS which must exist in each matching AASX package (BASE64-URL encoded).
     */
    @Get('')
    @Security('bearerAuth', ['package.read'])
    @OperationId('GetAllAASXPackageIds')
    public getPackages(
        @Query() aasId?: string,
        @Query() limit?: number,
        @Query() cursor?: string,
    ): Promise<PagedResult<PackageDescription>> {
        return this.repository.getPackages(limit, cursor, aasId ? decodeBase64Url(aasId) : undefined);
    }

    /**
     * @summary Returns a specific AASX package from the server.
     * @param packageId Requested package ID from the package list (BASE64-URL encoded).
     * @returns Requested AASX package.
     */
    @Get('/{packageId}')
    @Security('bearerAuth', ['package.read'])
    @OperationId('GetAASXByPackageId')
    @SuccessResponse(200)
    public async getPackage(@Path() packageId: string): Promise<NodeJS.ReadableStream> {
        const { filename, readable, size } = await this.repository.getPackage(decodeBase64Url(packageId));
        this.setHeader('Content-Type', 'application/octet-stream');
        this.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        if (size) {
            this.setHeader('Content-Length', size.toString());
        }

        return readable;
    }

    /**
     * @summary Creates an AASX package at the server.
     * @param file New AASX package.
     * @param filename Filename of the AASX package.
     * @param aasIds Included AAS Ids.
     * @returns The identifier of the added package.
     */
    @Post('')
    @Security('bearerAuth', ['package.create'])
    @SuccessResponse(201)
    @OperationId('PostAASXPackage')
    public async addPackage(
        @UploadedFile() file: Express.Multer.File,
        @Query() filename?: string,
        @Query() aasIds?: string[],
    ): Promise<string> {
        noop(aasIds);
        return await this.repository.add(file.path, filename ?? file.originalname);
    }

    /**
     * @summary Replaces the AASX package at the server.
     * @param packageId Package ID from the package list (BASE64-URL encoded).
     * @param file New AASX package.
     * @param filename Filename of the AASX package.
     * @param aasIds Included AAS Ids.
     */
    @Put('/{packageId}')
    @Security('bearerAuth', ['package.update'])
    @OperationId('PutAASXPackageById')
    public updatePackage(
        @Path() packageId: string,
        @UploadedFile() file: Express.Multer.File,
        @Query() filename?: string,
        @Query() aasIds?: string[],
    ): Promise<void> {
        noop(aasIds);
        return this.repository.update(decodeBase64Url(packageId), file.path, filename ?? file.originalname);
    }

    /**
     * @summary Deletes a specific AASX package from the server.
     * @param packageId Package ID from the package list (BASE64-URL encoded).
     */
    @Delete('/{packageId}')
    @Security('bearerAuth', ['package.delete'])
    @OperationId('DeleteAASXPackageById')
    public async deletePackage(@Path() packageId: string): Promise<void> {
        await this.repository.delete(decodeBase64Url(packageId));
    }
}
