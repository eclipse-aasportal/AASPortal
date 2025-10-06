/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
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

import { aas, PagedResult } from 'aas-core';

import { type LevelModifier, type ExtentModifier } from '../types.js';
import { ShellRepository } from '../shell-repository.js';
import { decodeBase64Url, mimeType, toAssetAdministrationShell } from '../utilities.js';

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
    @Security('bearerAuth', ['aas.read'])
    @OperationId('GetAllAssetAdministrationShells')
    public async getShells(
        @Query() limit?: number,
        @Query() cursor?: string,
    ): Promise<PagedResult<aas.AssetAdministrationShell>> {
        return await this.repository.getShells(limit, cursor);
    }

    /**
     * @summary Returns a specific Asset Administration Shell.
     * @param aasId The Asset Administration Shell’s unique id (BASE64-URL encoded).
     * @param level Determines the structural depth of the respective resource content.
     * @param extent Determines to which extent the resource is being serialized.
     * @returns Requested Asset Administration Shell.
     */
    @Get('/{aasId}')
    @Security('bearerAuth', ['aas.read'])
    @OperationId('GetAssetAdministrationShellById')
    public async getShellById(@Path() aasId: string): Promise<aas.AssetAdministrationShell> {
        return await this.repository.getShell(decodeBase64Url(aasId));
    }

    /**
     * @summary Returns the Asset Information.
     * @param aasId The Asset Administration Shell’s unique id (BASE64-URL encoded).
     * @returns Requested Asset Information.
     */
    @Get('/{aasId}/asset-information')
    @Security('bearerAuth', ['aas.read'])
    @OperationId('GetAssetInformation')
    @SuccessResponse(200)
    public async getAssetInformation(@Path() aasId: string): Promise<aas.AssetInformation> {
        return await this.repository.getAssetInformation(decodeBase64Url(aasId));
    }

    /**
     * @summary Returns the thumbnail file.
     * @param aasId The Asset Administration Shell’s unique id (BASE64-URL encoded).
     * @returns Requested thumbnail file.
     */
    @Get('/{aasId}/asset-information/thumbnail')
    @Security('bearerAuth', ['aas.read'])
    @OperationId('GetThumbnail')
    @SuccessResponse(200)
    public async getThumbnail(@Path() aasId: string): Promise<NodeJS.ReadableStream> {
        const { filename, readable, size, contentType } = await this.repository.getThumbnail(decodeBase64Url(aasId));
        this.setHeader('Content-Type', contentType ?? mimeType(filename));
        this.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        if (size) {
            this.setHeader('Content-Length', size.toString());
        }

        return readable;
    }

    /**
     * @summary Replaces the thumbnail file.
     * @param aasId The Asset Administration Shell’s unique id (BASE64-URL encoded).
     * @param file Thumbnail file.
     */
    @Put('/{aasId}/asset-information/thumbnail')
    @Security('bearerAuth', ['aas.update'])
    @OperationId('PostThumbnail')
    public async updateThumbnail(@Path() aasId: string, @UploadedFile() file: Express.Multer.File): Promise<void> {
        await this.repository.updateThumbnail(decodeBase64Url(aasId), file.path, file.originalname);
    }

    /**
     * @summary Delete the thumbnail file.
     * @param aasId The Asset Administration Shell’s unique id (BASE64-URL encoded).
     */
    @Delete('/{aasId}/asset-information/thumbnail')
    @Security('bearerAuth', ['aas.update'])
    @OperationId('DeleteThumbnail')
    public async deleteThumbnail(@Path() aasId: string): Promise<void> {
        await this.repository.deleteThumbnail(decodeBase64Url(aasId));
    }

    /**
     * @summary Creates a new Asset Administration Shell. The id of the new Asset Administration
     * Shell must be set in the payload.
     * @param aas Asset Administration Shell object.
     * @returns Created Asset Administration Shell.
     */
    @Post('')
    @Security('bearerAuth', ['sm.create'])
    @OperationId('PostAssetAdministrationShell')
    @SuccessResponse('201', 'Created')
    public async addShell(@Body() aas: aas.AssetAdministrationShell): Promise<aas.AssetAdministrationShell> {
        return toAssetAdministrationShell(await this.repository.addShell(aas));
    }

    /**
     * @summary Replaces the Asset Administration Shell.
     * @param aas Asset Administration Shell object.
     * @returns Replaced Asset Administration Shell.
     */
    @Put('/{aasId}')
    @Security('bearerAuth', ['sm.create'])
    @OperationId('PutAssetAdministrationShell')
    public async updateShell(@Body() aas: aas.AssetAdministrationShell): Promise<aas.AssetAdministrationShell> {
        return await this.repository.updateShell(aas);
    }

    /**
     * @summary Returns a specific Submodel.
     * @param aasId The Asset Administration Shell's unique id (BASE64-URL encoded).
     * @param smId The Submodel’s unique id (BASE64-URL encoded).
     * @returns Requested Submodel.
     */
    @Get('/{aasId}/submodels/{smId}')
    @Security('bearerAuth', ['sm.read'])
    @OperationId('GetSubmodelById')
    public async getSubmodel(
        @Path() aasId: string,
        @Path() smId: string,
        @Query() level: LevelModifier = 'deep',
        @Query() extent: ExtentModifier = 'withoutBlobValue',
    ): Promise<aas.Submodel> {
        return await this.repository.getSubmodel(decodeBase64Url(aasId), decodeBase64Url(smId), level, extent);
    }

    /**
     * @summary Returns a specific submodel element from the Submodel at a specified path.
     * @param aasId The Asset Administration Shell's unique id (BASE64-URL encoded).
     * @param smId The Submodel’s unique id (BASE64-URL encoded).
     * @param idShortPath IdShort path to the submodel element (dot-separated).
     * @param level Determines the structural depth of the respective resource content.
     * @param extent Determines to which extent the resource is being serialized.
     */
    @Get('/{aasId}/submodels/{smId}/submodel-elements/{idShortPath}')
    @Security('bearerAuth', ['sm.create'])
    @OperationId('GetSubmodelElementByPath')
    public async getSubmodelElement(
        @Path() aasId: string,
        @Path() smId: string,
        @Path() idShortPath: string,
        @Query() level: LevelModifier = 'deep',
        @Query() extent: ExtentModifier = 'withoutBlobValue',
    ): Promise<aas.SubmodelElement> {
        return await this.repository.getSubmodelElement(
            decodeBase64Url(aasId),
            decodeBase64Url(smId),
            idShortPath,
            level,
            extent,
        );
    }

    /**
     * @summary Downloads file content from a specific submodel element from the Submodel at a specified path.
     * @param aasId The Asset Administration Shell's unique id (BASE64-URL encoded).
     * @param smId The Submodel’s unique id (BASE64-URL encoded).
     * @param idShortPath IdShort path to the submodel element (dot-separated).
     */
    @Get('/{aasId}/submodels/{smId}/submodel-elements/{idShortPath}/attachment')
    @Security('bearerAuth', ['sme.read'])
    @OperationId('GetSubmodelElementAttachment')
    public async getSubmodelElementAttachment(
        @Path() aasId: string,
        @Path() smId: string,
        @Path() idShortPath: string,
    ): Promise<NodeJS.ReadableStream> {
        const { filename, readable, size, contentType } = await this.repository.getSubmodelElementAttachment(
            decodeBase64Url(aasId),
            decodeBase64Url(smId),
            idShortPath,
        );

        this.setHeader('Content-Type', contentType ?? mimeType(filename));
        this.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        if (size) {
            this.setHeader('Content-Length', size.toString());
        }

        return readable;
    }
}
