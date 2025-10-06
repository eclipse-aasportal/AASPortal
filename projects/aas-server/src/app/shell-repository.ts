/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import fs from 'fs';
import { inject, singleton } from 'tsyringe';
import { aas, jsonization, PagedResult, types } from 'aas-core';
import { Database } from './data/database.js';
import { ExtentModifier, FileResult, LevelModifier } from './types.js';
import { AasxPackage } from './aasx-package.js';
import { ApplicationError } from './application-error.js';
import { ERROR } from './error.js';
import { AddPackageCommand } from './data/commands/add-package-command.js';
import { UpdateThumbnailCommand } from './data/commands/update-thumbnail-command.js';
import { DeleteThumbnailCommand } from './data/commands/delete-thumbnail-command.js';
import { KeyList } from './data/key-list.js';
import { checkSubmodelIsReferenced, extensionToMimeType, toJsonValue } from './utilities.js';
import { SubmodelRepository } from './submodel-repository.js';
import { HttpCache } from './http-cache.js';
import { AasxPackageBuilder } from './aasx-package-builder.js';
import { UpdateShellCommand } from './data/commands/update-shell-command.js';

@singleton()
export class ShellRepository {
    public constructor(
        @inject(Database) private readonly db: Database,
        @inject(SubmodelRepository) private readonly submodelRepository: SubmodelRepository,
        @inject(HttpCache) private readonly cache: HttpCache,
        @inject(AasxPackageBuilder) private packageBuilder: AasxPackageBuilder,
    ) {}

    public async getShells(limit?: number, cursor?: string): Promise<PagedResult<aas.AssetAdministrationShell>> {
        const query = `?cursor=${cursor}&limit=${limit}`;
        let result = this.cache.getResult<aas.AssetAdministrationShell>('/shells', query);
        if (!result) {
            result = await this.db.getShells(limit, cursor);
            this.cache.setResult('/shells', query, result);
        }

        return result;
    }

    public async getShell(id: string): Promise<aas.AssetAdministrationShell> {
        const query = '';
        let aas = this.cache.getIdentifiable<aas.AssetAdministrationShell>(id, query);
        if (!aas) {
            aas = await this.db.getShell(id);
            this.cache.setIdentifiable(query, aas);
        }

        return aas;
    }

    public async getAssetInformation(id: string): Promise<aas.AssetInformation> {
        return (await this.getShell(id)).assetInformation;
    }

    public async getThumbnail(id: string): Promise<FileResult> {
        const key = await this.db.shells.getKey(id);
        const item = await this.db.shells.getItem(key);
        const packageId = new KeyList(item.packageKeys).at(0);
        if (packageId === undefined) {
            throw new Error('Invalid operation.');
        }

        const shell = await this.getShell(id);
        const file = shell.assetInformation.defaultThumbnail?.path;
        if (!file) {
            throw new ApplicationError(
                `The AAS with the identifier ${id} has no thumbnail.`,
                ERROR.THUMBNAIL_DOES_NOT_EXIST,
                404,
            );
        }

        let contentType = shell.assetInformation.defaultThumbnail?.contentType;
        if (!contentType) {
            contentType = extensionToMimeType(path.extname(file));
        }

        const aasx = new AasxPackage(this.db.packages.getFilePath(packageId));
        const readable = await aasx.read(file);
        return { filename: path.basename(file), readable, contentType };
    }

    public async updateThumbnail(aasId: string, path: string, filename: string): Promise<void> {
        const command = new UpdateThumbnailCommand(this.db, aasId, path, filename);
        await this.db.execute(command);
        this.cache.remove(aasId);
        this.cache.remove('/shells');
    }

    public async deleteThumbnail(aasId: string): Promise<void> {
        const command = new DeleteThumbnailCommand(this.db, aasId);
        await this.db.execute(command);
        this.cache.remove(aasId);
        this.cache.remove('/shells');
    }

    public async addShell(aas: aas.AssetAdministrationShell): Promise<types.AssetAdministrationShell> {
        const filename = aas.idShort + '.aasx';
        const sourceFile = path.join(this.db.tmpDir, filename);
        if (fs.existsSync(sourceFile)) {
            await fs.promises.unlink(sourceFile);
        }

        const result = jsonization.assetAdministrationShellFromJsonable(toJsonValue(aas));
        if (result.error) {
            throw result.error;
        }

        const value = result.mustValue();
        const env = new types.Environment([value], [], []);
        await this.packageBuilder.create(sourceFile, env);

        const command = new AddPackageCommand(this.db, sourceFile, filename, env);
        await this.db.execute(command);
        this.cache.remove(aas.id);
        this.cache.remove('/shells');
        return value;
    }

    public async updateShell(aas: aas.AssetAdministrationShell): Promise<aas.AssetAdministrationShell> {
        const result = jsonization.assetAdministrationShellFromJsonable(toJsonValue(aas));
        if (result.error) {
            throw result.error;
        }

        const key = await this.db.shells.getKey(aas.id);
        const replaced = await this.db.shells.readJson(key);
        const command = new UpdateShellCommand(this.db, result.mustValue());
        await this.db.execute(command);

        return replaced;
    }

    public async getSubmodel(
        aasId: string,
        smId: string,
        level: LevelModifier,
        extent: ExtentModifier,
    ): Promise<aas.Submodel> {
        const shell = await this.db.getShell(aasId);
        checkSubmodelIsReferenced(shell, smId);
        return await this.submodelRepository.getSubmodel(smId, level, extent);
    }

    public async getSubmodelElement(
        aasId: string,
        smId: string,
        idShortPath: string,
        level: LevelModifier,
        extent: ExtentModifier,
    ): Promise<aas.SubmodelElement> {
        const shell = await this.db.getShell(aasId);
        checkSubmodelIsReferenced(shell, smId);
        return await this.submodelRepository.getSubmodelElement(smId, idShortPath, level, extent);
    }

    public async getSubmodelElementAttachment(aasId: string, smId: string, idShortPath: string): Promise<FileResult> {
        const shell = await this.db.getShell(aasId);
        checkSubmodelIsReferenced(shell, smId);
        return await this.submodelRepository.getSubmodelElementAttachment(smId, idShortPath);
    }
}
