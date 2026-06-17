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
    Query,
    Route,
    Security,
    SuccessResponse,
    Tags,
} from 'tsoa';

import { aas, jsonization, PagedResult } from 'aas-core';
import { decodeBase64Url } from 'aas-package';

import { ConceptDescriptionRepository } from '../concept-description-repository.js';

/**
 * @summary Asset Administration Shell Repository Interface.
 */
@injectable()
@Route('/concept-descriptions')
@Tags('Concept Description Repository Interface')
export class ConceptDescriptionsController extends Controller {
    public constructor(
        @inject(ConceptDescriptionRepository) private readonly repository: ConceptDescriptionRepository,
    ) {
        super();
    }

    /**
     * @summary Returns all Concept Descriptions.
     * @param limit The maximum size of the result set.
     * @param cursor The position from which to resume a result listing.
     * @returns List of Concept Descriptions.
     */
    @Get('')
    @Security({ api_key: [] })
    @OperationId('GetAllConceptDescriptions')
    public getConceptDescriptions(
        @Query() limit?: number,
        @Query() cursor?: string,
    ): Promise<PagedResult<aas.ConceptDescription>> {
        return this.repository.getConceptDescriptions(limit, cursor);
    }

    /**
     * @summary Returns a specific Concept Description.
     * @param id The Concept Description’s unique id (Base64-URL encoded).
     * @returns Requested Concept Description.
     */
    @Get('/{id}')
    @Security({ api_key: [] })
    @OperationId('GetConceptDescriptionById')
    public async getConceptDescription(@Path() id: string): Promise<aas.ConceptDescription> {
        return await this.repository.getConceptDescription(decodeBase64Url(id));
    }

    /**
     * @summary Creates a new Concept Description. The id of the new Concept Description must be set in the payload.
     * @param conceptDescription Concept Description object.
     * @returns Created Concept Description.
     */
    @Post('')
    @Security({ api_key: [] })
    @OperationId('PostConceptDescription')
    @SuccessResponse('201', 'Created')
    public async addConceptDescription(
        @Body() conceptDescription: aas.ConceptDescription,
    ): Promise<aas.ConceptDescription> {
        return jsonization.toJsonable(
            await this.repository.addConceptDescription(conceptDescription),
        ) as unknown as aas.ConceptDescription;
    }

    /**
     * @summary Deletes a Concept Description.
     * @param id The Concept Description’s unique id (Base64-URL encoded).
     */
    @Delete('/{id}')
    @Security({ api_key: [] })
    @OperationId('DeleteConceptDescriptionById')
    public async deleteConceptDescription(@Path() id: string): Promise<void> {
        await this.repository.deleteConceptDescription(decodeBase64Url(id));
    }
}
