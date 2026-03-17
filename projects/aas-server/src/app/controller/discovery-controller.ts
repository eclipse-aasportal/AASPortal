/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Controller, Get, OperationId, Query, Route, Security, Tags } from 'tsoa';
import { PagedResult } from 'aas-core';
import { decodeBase64Url } from 'aas-package';
import { Discovery } from '../discovery.js';

/**
 * These interfaces allow to publish information about Asset Administration Shells
 * that enable a search for asset IDs of the corresponding Asset Administration Shells
 * in a subsequent discovery interface call.
 */
@injectable()
@Route('/lookup')
@Tags('Basic Discovery')
export class DiscoveryController extends Controller {
    public constructor(@inject(Discovery) private readonly discovery: Discovery) {
        super();
    }

    /**
     * @summary Returns a list of Asset Administration Shell ids based on
     *          asset identifier key-value-pairs.
     *
     * @param assetIds The specific assetId of an asset identifier, which could be the
     *                 globalAssetId or specificAssetIds.
     * @param limit The maximum size of the result set.
     * @param cursor The position from which to resume a result listing.
     * @returns Identifiers of all Asset Administration Shells which contain all
     *          asset identifier key-value-pairs in their asset information, i.e. AND-match
     *          of key-value-pairs per Asset Administration Shell
     */
    @Get('/shells')
    @Security({ api_key: [] })
    @OperationId('GetAllAssetAdministrationShellIdsByAssetLink')
    public async getAllAssetAdministrationShellIdsByAssetLink(
        @Query() assetIds: string[],
        @Query() limit: number,
        @Query() cursor: string | undefined,
    ): Promise<PagedResult<string>> {
        return await this.discovery.getAASIdsByAssetLink(
            assetIds.map(id => decodeBase64Url(id)),
            limit,
            cursor,
        );
    }
}
