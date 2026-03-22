/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { noop, toAssetAdministrationShell, toConceptDescription, toSubmodel, types } from 'aas-core';

import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { getChildren } from '../../utilities.js';
import { AasxPackage } from '../../aasx-package.js';
import { DatabaseKey } from '../database-types.js';

export abstract class PackageCommand extends DatabaseCommand {
    protected aasx!: AasxPackage;
    protected packageKey!: DatabaseKey;

    protected constructor(database: Database, resolve: (result: string) => void, reject: (reason: Error) => void) {
        super(database, resolve, reject);
    }

    protected async addShell(shell: types.AssetAdministrationShell): Promise<DatabaseKey> {
        const table = this.database.shells;
        let key = await table.findKey(shell.id);
        if (key === undefined) {
            key = await table.insert(toAssetAdministrationShell(shell));
            const globalAssetId = shell.assetInformation.globalAssetId;
            if (globalAssetId) {
                const globalAssetKey =
                    (await this.database.assetIndex.findKey(globalAssetId)) ??
                    (await this.database.assetIndex.create(globalAssetId));

                await this.database.assetIndex.add(globalAssetKey, table, key);
            }

            const thumbnail = await this.aasx.getThumbnailName();
            if (thumbnail) {
                await table.writeAsset(key, thumbnail, await this.aasx.getThumbnail());
            }

            if (shell.assetInformation.defaultThumbnail) {
                const defaultThumbnail = shell.assetInformation.defaultThumbnail;
                if (defaultThumbnail.path) {
                    try {
                        await table.writeAsset(key, defaultThumbnail.path, this.aasx.read(defaultThumbnail.path));
                    } catch (error) {
                        noop(error);
                    }
                }
            }
        }

        await this.database.packageIndex.add(this.packageKey, table, key);
        return key;
    }

    protected async addSubmodel(submodel: types.Submodel): Promise<DatabaseKey> {
        const table = this.database.submodels;
        let key = await table.findKey(submodel.id);
        if (key === undefined) {
            key = await table.insert(toSubmodel(submodel));
            for (const file of this.selectFiles(submodel)) {
                if (file.value) {
                    try {
                        await table.writeAsset(key, file.value, this.aasx.read(file.value));
                    } catch (error) {
                        noop(error);
                    }
                }
            }
        }

        await this.database.packageIndex.add(this.packageKey, table, key);
        return key;
    }

    protected async addConceptDescription(conceptDescription: types.ConceptDescription): Promise<DatabaseKey> {
        const table = this.database.conceptDescriptions;
        let key = await table.findKey(conceptDescription.id);
        if (key === undefined) {
            key = await table.insert(toConceptDescription(conceptDescription));
        }

        await this.database.packageIndex.add(this.packageKey, table, key);
        return key;
    }

    protected *selectFiles(referable: types.IReferable): Generator<types.File> {
        const stack: types.IReferable[][] = [];
        if (referable instanceof types.File) {
            yield referable;
        }

        let children = getChildren(referable);
        if (children.length > 0) {
            stack.push(children);
        }

        while (stack.length) {
            for (const child of stack.pop()!) {
                if (child instanceof types.File) {
                    yield child;
                }

                children = getChildren(child);
                if (children.length > 0) {
                    stack.push(children);
                }
            }
        }
    }
}