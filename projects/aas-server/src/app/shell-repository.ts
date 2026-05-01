/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import { inject, singleton } from 'tsyringe';
import { aas, ApplicationError, extensionToMimeType, PagedResult } from 'aas-core';
import { FileResult } from 'aas-package';

import { Database } from './db/database.js';
import { ERROR } from './error.js';
import { UpdateThumbnailCommand } from './db/commands/update-thumbnail-command.js';
import { DeleteThumbnailCommand } from './db/commands/delete-thumbnail-command.js';
import { UpdateShellCommand } from './db/commands/update-shell-command.js';
import { AasxPackageBuilder } from './aasx-package-builder.js';
import { AddShellCommand } from './db/commands/add-shell-command.js';
import { Variable } from './variable.js';

/**
 * Asset Administration Shell Repository.
 */
@singleton()
export class ShellRepository {
    public constructor(
        @inject(Variable) private readonly variable: Variable,
        @inject(Database) private readonly db: Database,
        @inject(AasxPackageBuilder) private packageBuilder: AasxPackageBuilder,
    ) {}

    /**
     * Retrieves a paginated list of Asset Administration Shells (AAS).
     *
     * This method first attempts to fetch the result from the cache. If the result is not cached,
     * it queries the database for the specified page of shells, then caches the result for future use.
     *
     * @param limit - Optional. The maximum number of shells to return in the result set.
     * @param cursor - Optional. A cursor string for pagination, indicating the starting point for the next set of results.
     * @returns A promise that resolves to a paged result containing Asset Administration Shells.
     */
    public async getShells(limit?: number, cursor?: string): Promise<PagedResult<aas.AssetAdministrationShell>> {
        return await this.db.shells.getPage(limit ?? this.variable.LIMIT, cursor);
    }

    /**
     * Retrieves an Asset Administration Shell (AAS) by its identifier.
     *
     * This method first attempts to fetch the AAS from the cache using the provided `id`.
     * If the AAS is not found in the cache, it retrieves the AAS from the database,
     * stores it in the cache, and then returns it.
     *
     * @param id - The unique identifier of the Asset Administration Shell to retrieve.
     * @returns A promise that resolves to the requested `aas.AssetAdministrationShell`.
     */
    public async getShell(id: string): Promise<aas.AssetAdministrationShell> {
        const key = await this.db.shells.getKey(id);
        return await this.db.shells.readObject(key);
    }

    /**
     * Retrieves the asset information for the Asset Administration Shell with the specified identifier.
     *
     * @param id - The unique identifier of the Asset Administration Shell.
     * @returns A promise that resolves to the {@link aas.AssetInformation} associated with the specified asset shell.
     * @throws Will throw an error if the asset shell cannot be found or retrieved.
     */
    public async getAssetInformation(id: string): Promise<aas.AssetInformation> {
        return (await this.getShell(id)).assetInformation;
    }

    /**
     * Retrieves the thumbnail image for a given AAS (Asset Administration Shell).
     *
     * @param id - The unique identifier of the shell whose thumbnail is to be retrieved.
     * @returns A promise that resolves to a `FileResult` containing the thumbnail's details.
     * @throws {Error} If the shell's package key is invalid or missing.
     * @throws {ApplicationError} If the thumbnail does not exist for the shell.
     */
    public async getThumbnail(id: string): Promise<FileResult> {
        const table = this.db.shells;
        const key = await table.getKey(id);
        const shell = await table.readObject(key);
        const thumbnail = shell.assetInformation.defaultThumbnail;
        if (!thumbnail) {
            throw new ApplicationError(ERROR.THUMBNAIL_DOES_NOT_EXIST, { id }, 404);
        }

        let contentType = thumbnail.contentType;
        if (!contentType) {
            contentType = extensionToMimeType(path.extname(thumbnail.path));
        }

        const readable = table.readAsset(key, thumbnail.path);
        return { filename: path.basename(thumbnail.path), value: thumbnail.path, readable, contentType };
    }

    /**
     * Updates the thumbnail for a given AAS (Asset Administration Shell).
     *
     * @param aasId - The unique identifier of the AAS whose thumbnail is to be updated.
     * @param path - The file system path to the new thumbnail image.
     * @param filename - The name of the new thumbnail file.
     * @returns A promise that resolves when the thumbnail update is complete.
     */
    public updateThumbnail(aasId: string, path: string, filename: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const command = new UpdateThumbnailCommand(this.db, resolve, reject, aasId, path, filename);
            this.db.execute(command);
        });
    }

    /**
     * Deletes the thumbnail associated with the specified AAS (Asset Administration Shell) ID.
     *
     * @param aasId - The unique identifier of the AAS whose thumbnail should be deleted.
     * @returns A promise that resolves when the thumbnail has been deleted.
     */
    public deleteThumbnail(aasId: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const command = new DeleteThumbnailCommand(this.db, resolve, reject, aasId);
            this.db.execute(command);
        });
    }

    /**
     * Adds a new Asset Administration Shell (AAS) to the repository.
     *
     * @param aas - The Asset Administration Shell to be added.
     * @returns A promise that resolves to the added `AssetAdministrationShell`.
     */
    public addShell(aas: aas.AssetAdministrationShell): Promise<aas.AssetAdministrationShell> {
        return new Promise((resolve, reject) => {
            const command = new AddShellCommand(this.db, resolve, reject, this.packageBuilder, aas);
            this.db.execute(command);
        });
    }

    /**
     * Updates an existing Asset Administration Shell (AAS) in the database.
     *
     * @param aas - The `AssetAdministrationShell` instance to update in the database.
     * @returns A promise that resolves to the updated `AssetAdministrationShell`.
     */
    public updateShell(aas: aas.AssetAdministrationShell): Promise<aas.AssetAdministrationShell> {
        return new Promise((resolve, reject) => {
            const command = new UpdateShellCommand(this.db, resolve, reject, aas);
            this.db.execute(command);
        });
    }
}
