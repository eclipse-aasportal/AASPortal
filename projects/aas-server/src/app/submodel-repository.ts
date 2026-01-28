/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import path from 'path';
import { aas, ApplicationError, isFile, jsonization, PagedResult, types } from 'aas-core';
import { FileResult } from 'aas-package';

import { Database } from './db/database.js';
import { ExtentModifier, LevelModifier } from './types.js';
import { ERROR } from './error.js';
import { AddSubmodelCommand } from './db/commands/add-submodel-command.js';
import { UpdateAttachmentCommand } from './db/commands/update-attachment-command.js';
import { DeleteAttachmentCommand } from './db/commands/delete-attachment-command.js';
import { KeyList } from './db/key-list.js';
import { HttpCache } from './http-cache.js';
import { processSerializationModifier, selectSubmodelElement, toValueSerialization } from './utilities.js';
import { AasxPackage } from './aasx-package.js';
import { PatchSubmodelElementValueCommand } from './db/commands/patch-submodel-element-value-command.js';

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

    public async getFileByPath(id: string, idShortPath: string): Promise<FileResult> {
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

        throw new ApplicationError(ERROR.FILE_HAS_NO_ATTACHMENT, { id, idShortPath }, 404);
    }

    public putFileByPath(id: string, idShortPath: string, path: string, filename: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const command = new UpdateAttachmentCommand(
                this.db,
                resolve,
                reject,
                undefined,
                id,
                idShortPath,
                path,
                filename,
            );

            this.db.execute(command);
            this.cache.remove('/submodels');
            this.cache.remove(id);
        });
    }

    public deleteFileByPath(id: string, idShortPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const command = new DeleteAttachmentCommand(this.db, resolve, reject, undefined, id, idShortPath);
            this.db.execute(command);
            this.cache.remove('/submodels');
            this.cache.remove(id);
        });
    }

    public async addSubmodel(submodel: aas.Submodel): Promise<types.Submodel> {
        return new Promise((resolve, reject) => {
            const command = new AddSubmodelCommand(this.db, resolve, reject, submodel);
            this.db.execute(command);
            this.cache.remove('/submodels');
        });
    }

    public async getSubmodelElement(
        id: string,
        idShortPath: string,
        level: LevelModifier,
        extent: ExtentModifier,
    ): Promise<aas.SubmodelElement> {
        let element = this.cache.getSubmodelElement(id, idShortPath, level, extent);
        if (!element) {
            const submodel = await this.db.getSubmodel(id);
            element = selectSubmodelElement(submodel, idShortPath);
            if (!element) {
                throw new ApplicationError(
                    ERROR.SUBMODEL_ELEMENT_DOES_NOT_EXIST,
                    {
                        id,
                        idShortPath,
                    },
                    404,
                );
            }

            processSerializationModifier(element, level, extent);
            this.cache.setSubmodelElement(id, idShortPath, level, extent, element);
        }

        return element;
    }

    /**
     * Retrieves the value of a submodel element specified by its identifier and path.
     *
     * @param id - The unique identifier of the submodel.
     * @param idShortPath - The path to the submodel element, using idShort notation.
     * @param level - The level modifier that determines the depth or detail of the retrieval.
     * @param extent - The extent modifier that specifies the scope of the retrieval.
     * @returns A promise that resolves to the serialized value of the submodel element as a `JsonValue`.
     */
    public async getSubmodelElementValue(
        id: string,
        idShortPath: string,
        level: LevelModifier,
        extent: ExtentModifier,
    ): Promise<jsonization.JsonValue> {
        const element = await this.getSubmodelElement(id, idShortPath, level, extent);
        return toValueSerialization(element);
    }

    /**
     * Updates the value of a specific submodel element identified by its `id` and `idShortPath`.
     *
     * This method creates and executes a `PatchSubmodelElementValueCommand` to update the submodel element's value
     * in the database. After the update, it removes the relevant cache entry for submodels to ensure consistency.
     *
     * @param id - The unique identifier of the submodel containing the element to be updated.
     * @param idShortPath - The path (in idShort format) to the specific submodel element whose value is to be patched.
     * @param value - The new value to assign to the submodel element, represented as a `JsonValue`.
     * @returns A promise that resolves when the operation is complete.
     */
    public async patchSubmodelElementValue(
        id: string,
        idShortPath: string,
        value: jsonization.JsonValue,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const command = new PatchSubmodelElementValueCommand(this.db, resolve, reject, id, idShortPath, value);
            this.db.execute(command);
            this.cache.remove('/submodels');
        });
    }
}
