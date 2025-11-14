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

import { aas, extensionToMimeType, PagedResult, toSubmodel } from 'aas-core';

import { type ExtentModifier, type LevelModifier } from '../types.js';
import { decodeBase64Url } from '../utilities.js';
import { SubmodelRepository } from '../submodel-repository.js';

/**
 * @summary Submodel Repository Interface.
 */
@injectable()
@Route('/submodels')
@Tags('Submodel Repository Interface')
export class SubmodelsController extends Controller {
    public constructor(@inject(SubmodelRepository) private readonly repository: SubmodelRepository) {
        super();
    }

    /**
     * @summary Returns all Submodels.
     * @param limit The maximum size of the result set.
     * @param cursor The position from which to resume a result listing.
     * @param level Determines the structural depth of the respective resource content.
     * @param extent Determines to which extent the resource is being serialized.
     * @returns List of Submodels.
     */
    @Get('')
    @Security('bearerAuth')
    @OperationId('GetAllSubmodels ')
    public getSubmodels(
        @Query() limit?: number,
        @Query() cursor?: string,
        @Query() level: LevelModifier = 'deep',
        @Query() extent: ExtentModifier = 'withoutBlobValue',
    ): Promise<PagedResult<aas.ConceptDescription>> {
        return this.repository.getSubmodels(limit, cursor, level, extent);
    }

    /**
     * @summary Returns a specific Submodel.
     * @param id The Submodel’s unique id (BASE64-URL encoded).
     * @param level Determines the structural depth of the respective resource content.
     * @param extent Determines to which extent the resource is being serialized.
     * @returns Requested Submodel.
     */
    @Get('/{id}')
    @Security('bearerAuth', ['sm.read'])
    @OperationId('GetSubmodelById')
    public async getSubmodel(
        @Path() id: string,
        @Query() level: LevelModifier = 'deep',
        @Query() extent: ExtentModifier = 'withoutBlobValue',
    ): Promise<aas.Submodel> {
        return await this.repository.getSubmodel(decodeBase64Url(id), level, extent);
    }

    /**
     * @summary Downloads file content from a specific submodel element from the Submodel at a specified path.
     * @param id The Submodel’s unique id (BASE64-URL encoded).
     * @param idShortPath IdShort path to the submodel element (dot-separated).
     */
    @Get('/{id}/submodel-elements/{idShortPath}/attachment')
    @Security('bearerAuth', ['sme.read'])
    @OperationId('GetSubmodelElementAttachment')
    public async getSubmodelElementAttachment(
        @Path() id: string,
        @Path() idShortPath: string,
    ): Promise<NodeJS.ReadableStream> {
        const { filename, readable, size, contentType } = await this.repository.getSubmodelElementAttachment(
            decodeBase64Url(id),
            idShortPath,
        );

        this.setHeader('Content-Type', contentType ?? extensionToMimeType(filename));
        this.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        if (size) {
            this.setHeader('Content-Length', size.toString());
        }

        return readable;
    }

    /**
     * @summary Uploads file content to an existing submodel element at a specified path.
     * @param id The Submodel’s unique id (BASE64-URL encoded).
     * @param idShortPath IdShort path to the submodel element (dot-separated).
     * @param file File to upload.
     */
    @Put('/{id}/submodel-elements/{idShortPath}/attachment')
    @Security('bearerAuth', ['sme.read'])
    @OperationId('PutSubmodelElementAttachment')
    public async updateSubmodelElementAttachment(
        @Path() id: string,
        @Path() idShortPath: string,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<void> {
        await this.repository.updateSubmodelElementAttachment(
            decodeBase64Url(id),
            idShortPath,
            file.path,
            file.originalname,
        );
    }

    /**
     * @summary file content to an existing submodel element at a specified path.
     * @param id The Submodel’s unique id (BASE64-URL encoded).
     * @param idShortPath IdShort path to the submodel element (dot-separated).
     */
    @Delete('/{id}/submodel-elements/{idShortPath}/attachment')
    @Security('bearerAuth', ['sme.read'])
    @OperationId('DeleteSubmodelElementAttachment')
    public async deleteSubmodelElementAttachment(@Path() id: string, @Path() idShortPath: string): Promise<void> {
        await this.repository.deleteSubmodelElementAttachment(decodeBase64Url(id), idShortPath);
    }

    /**
     * @summary Creates a new Submodel. The id of the new submodel must be set in the payload.
     * @param submodel Submodel object.
     * @returns Created Created Submodel.
     */
    @Post('')
    @Security('bearerAuth', ['sm.create'])
    @OperationId('PostSubmodel')
    @SuccessResponse('201', 'Created')
    public async addSubmodel(@Body() submodel: aas.Submodel): Promise<aas.Submodel> {
        return toSubmodel(await this.repository.addSubmodel(submodel));
    }

    /**
     * @summary Returns a specific submodel element from the Submodel at a specified path.
     * @param id The Submodel’s unique id (BASE64-URL encoded).
     * @param idShortPath IdShort path to the submodel element (dot-separated).
     * @param level Determines the structural depth of the respective resource content.
     * @param extent Determines to which extent the resource is being serialized.
     */
    @Get('/{id}/submodel-elements/{idShortPath}')
    @Security('bearerAuth', ['sm.create'])
    @OperationId('GetSubmodelElementByPath')
    public async getSubmodelElement(
        @Path() id: string,
        @Path() idShortPath: string,
        @Query() level: LevelModifier = 'deep',
        @Query() extent: ExtentModifier = 'withoutBlobValue',
    ): Promise<aas.SubmodelElement> {
        return await this.repository.getSubmodelElement(decodeBase64Url(id), idShortPath, level, extent);
    }
}
