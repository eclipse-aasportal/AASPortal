/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { injectable, inject } from 'tsyringe';
import {
    Body,
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

import { aas, extensionToMimeType, PagedResult } from 'aas-core';
import { decodeBase64Url } from 'aas-package';

import { ShellRepository } from '../shell-repository.js';

/**
 * @summary Asset Administration Shell Repository Interface.
 */
@injectable()
@Route('/shells')
@Tags('Asset Administration Shell Repository Interface')
export class ShellsController extends Controller {
    public constructor(@inject(ShellRepository) private readonly repository: ShellRepository) {
        super();
    }

    /**
     * @summary Returns all Asset Administration Shells.
     * @param limit The maximum size of the result set.
     * @param cursor The position from which to resume a result listing.
     * @returns List of Asset Administration Shells.
     */
    @Get('')
    @Security({ api_key: [] })
    @OperationId('GetAllAssetAdministrationShells')
    public async getShells(
        @Query() limit?: number,
        @Query() cursor?: string,
    ): Promise<PagedResult<aas.AssetAdministrationShell>> {
        return await this.repository.getShells(limit, cursor);
    }

    /**
     * @summary Returns a specific Asset Administration Shell.
     * @param id The Asset Administration Shell’s unique id (BASE64-URL encoded).
     * @returns Requested Asset Administration Shell.
     */
    @Get('/{id}')
    @Security({ api_key: [] })
    @OperationId('GetAssetAdministrationShellById')
    public async getShellById(@Path() id: string): Promise<aas.AssetAdministrationShell> {
        return await this.repository.getShell(decodeBase64Url(id));
    }

    /**
     * @summary Returns the Asset Information.
     * @param id The Asset Administration Shell’s unique id (BASE64-URL encoded).
     * @returns Requested Asset Information.
     */
    @Get('/{id}/asset-information')
    @Security({ api_key: [] })
    @OperationId('GetAssetInformation')
    @SuccessResponse(200)
    public async getAssetInformation(@Path() id: string): Promise<aas.AssetInformation> {
        return await this.repository.getAssetInformation(decodeBase64Url(id));
    }

    /**
     * @summary Returns the thumbnail file.
     * @param id The Asset Administration Shell’s unique id (BASE64-URL encoded).
     * @returns Requested thumbnail file.
     */
    @Get('/{id}/asset-information/thumbnail')
    @Security({ api_key: [] })
    @OperationId('GetThumbnail')
    @SuccessResponse(200)
    public async getThumbnail(@Path() id: string): Promise<NodeJS.ReadableStream> {
        const { filename, readable, size, contentType } = await this.repository.getThumbnail(decodeBase64Url(id));
        this.setHeader('Content-Type', contentType ?? extensionToMimeType(filename));
        this.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        if (size) {
            this.setHeader('Content-Length', size.toString());
        }

        return readable;
    }

    /**
     * @summary Replaces the thumbnail file.
     * @param id The Asset Administration Shell’s unique id (BASE64-URL encoded).
     * @param file Thumbnail file.
     */
    @Put('/{id}/asset-information/thumbnail')
    @Security({ api_key: [] })
    @OperationId('PostThumbnail')
    public async updateThumbnail(@Path() id: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
        await this.repository.updateThumbnail(decodeBase64Url(id), file.path, file.originalname);
    }

    /**
     * @summary Delete the thumbnail file.
     * @param id The Asset Administration Shell’s unique id (BASE64-URL encoded).
     */
    @Delete('/{id}/asset-information/thumbnail')
    @Security({ api_key: [] })
    @OperationId('DeleteThumbnail')
    public async deleteThumbnail(@Path() id: string): Promise<void> {
        await this.repository.deleteThumbnail(decodeBase64Url(id));
    }

    /**
     * @summary Creates a new Asset Administration Shell. The id of the new Asset Administration
     * Shell must be set in the payload.
     * @param aas Asset Administration Shell object.
     * @returns Created Asset Administration Shell.
     */
    @Post('')
    @Security({ api_key: [] })
    @OperationId('PostAssetAdministrationShell')
    @SuccessResponse('201', 'Created')
    public async addShell(@Body() aas: aas.AssetAdministrationShell): Promise<aas.AssetAdministrationShell> {
        return await this.repository.addShell(aas);
    }

    /**
     * @summary Replaces the Asset Administration Shell.
     * @param aas Asset Administration Shell object.
     * @returns Replaced Asset Administration Shell.
     */
    @Put('')
    @Security({ api_key: [] })
    @OperationId('PutAssetAdministrationShell')
    public async updateShell(@Body() aas: aas.AssetAdministrationShell): Promise<aas.AssetAdministrationShell> {
        return await this.repository.updateShell(aas);
    }
}
