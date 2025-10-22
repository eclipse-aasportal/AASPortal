/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import path from 'path';
import { aas, isFile, PagedResult, types } from 'aas-core';
import { FileResult } from 'aas-package';

import { Database } from './db/database.js';
import { ExtentModifier, LevelModifier } from './types.js';
import { ApplicationError } from './application-error.js';
import { ERROR } from './error.js';
import { AddSubmodelCommand } from './db/commands/add-submodel-command.js';
import { UpdateAttachmentCommand } from './db/commands/update-attachment-command.js';
import { DeleteAttachmentCommand } from './db/commands/delete-attachment-command.js';
import { KeyList } from './db/key-list.js';
import { HttpCache } from './http-cache.js';
import { processSerializationModifier, selectSubmodelElement } from './utilities.js';
import { AasxPackage } from './aasx-package.js';

@singleton()
export class SubmodelRepository {
    public constructor(
        @inject(Database) private readonly db: Database,
        @inject(HttpCache) private readonly cache: HttpCache,
    ) {}

    public async getSubmodels(
        limit: number | undefined,
        cursor: string | undefined,
        level: LevelModifier,
        extent: ExtentModifier,
    ): Promise<PagedResult<aas.Submodel>> {
        const query = `?cursor=${cursor}&limit=${limit}&level=${level}&extent=${extent}`;
        let result = this.cache.getResult<aas.Submodel>('/submodels', query);
        if (!result) {
            result = await this.db.getSubmodels(limit, cursor);
            for (const submodel of result.result) {
                processSerializationModifier(submodel, level, extent);
            }

            this.cache.setResult('/submodels', query, result);
        }

        return result;
    }

    public async getSubmodel(id: string, level: LevelModifier, extent: ExtentModifier): Promise<aas.Submodel> {
        const query = `?level=${level}&extent=${extent}`;
        let submodel = this.cache.getIdentifiable<aas.Submodel>(id, query);
        if (!submodel) {
            submodel = await this.db.getSubmodel(id);
            processSerializationModifier(submodel, level, extent);
            this.cache.setIdentifiable(query, submodel);
        }

        return submodel;
    }

    public async getSubmodelElementAttachment(id: string, idShortPath: string): Promise<FileResult> {
        const key = await this.db.submodels.getKey(id);
        const item = await this.db.submodels.getItem(key);
        const submodel: aas.Submodel = await this.db.submodels.readJson(key);
        const element = selectSubmodelElement(submodel, idShortPath);
        if (isFile(element) && element.value) {
            for (const packageId of new KeyList(item.packageKeys)) {
                const aasx = await AasxPackage.createFromFile(this.db.packages.getFilePath(packageId));
                const readable = aasx.read(element.value);
                if (readable) {
                    return {
                        readable,
                        filename: path.basename(element.value),
                        value: element.value,
                        contentType: element.contentType,
                    };
                }
            }
        }

        throw new ApplicationError(`File ${id}.${idShortPath} has no attachment.`, ERROR.FILE_HAS_NO_ATTACHMENT, 404);
    }

    public async updateSubmodelElementAttachment(
        id: string,
        idShortPath: string,
        path: string,
        filename: string,
    ): Promise<void> {
        const command = new UpdateAttachmentCommand(this.db, undefined, id, idShortPath, path, filename);
        await this.db.execute(command);
        this.cache.remove('/submodels');
        this.cache.remove(id);
    }

    public async deleteSubmodelElementAttachment(id: string, idShortPath: string): Promise<void> {
        const command = new DeleteAttachmentCommand(this.db, undefined, id, idShortPath);
        await this.db.execute(command);
        this.cache.remove('/submodels');
        this.cache.remove(id);
    }

    public async addSubmodel(submodel: aas.Submodel): Promise<types.Submodel> {
        const command = new AddSubmodelCommand(this.db, submodel);
        const result = await this.db.execute(command);
        this.cache.remove('/submodels');
        return result;
    }

    public async getSubmodelElement(
        smId: string,
        idShortPath: string,
        level: LevelModifier,
        extent: ExtentModifier,
    ): Promise<aas.SubmodelElement> {
        let element = this.cache.getSubmodelElement(smId, idShortPath, level, extent);
        if (!element) {
            const submodel = await this.db.getSubmodel(smId);
            element = selectSubmodelElement(submodel, idShortPath);
            if (!element) {
                throw new ApplicationError(
                    `The Submodel Element ${smId}.${idShortPath} does not exist.`,
                    ERROR.SUBMODEL_ELEMENT_DOES_NOT_EXIST,
                    404,
                );
            }

            processSerializationModifier(element, level, extent);
            this.cache.setSubmodelElement(smId, idShortPath, level, extent, element);
        }

        return element;
    }
}
