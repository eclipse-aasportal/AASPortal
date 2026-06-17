/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError, noop, toAssetAdministrationShell, toConceptDescription, toSubmodel, types } from 'aas-core';

import { Database } from '../database.js';
import { AasxPackage } from '../../aasx-package.js';
import { ERROR } from '../../error.js';
import { DatabaseIndex } from '../database-index.js';
import { PackageCommand } from './package-command.js';
import { DatabaseKey, Table } from '../database-types.js';

export class UpdatePackageCommand extends PackageCommand {
    private readonly packageIndex: DatabaseIndex;

    public constructor(
        database: Database,
        resolve: () => void,
        reject: (reason: Error) => void,
        private readonly packageId: string,
        private readonly sourceFile: string,
        private readonly filename: string,
    ) {
        super(database, resolve, reject);

        this.packageIndex = this.database.packageIndex;
    }

    public override async execute(): Promise<void> {
        const packageKey = await this.packageIndex.findKey(this.packageId);
        if (packageKey === undefined) {
            throw new ApplicationError(ERROR.INVALID_PACKAGE_ID, {}, 404);
        }

        this.packageKey = packageKey;
        const oldIndex = [...(await this.packageIndex.getTableRefs(packageKey))];
        const newIndex: [Table, DatabaseKey][] = [];

        this.aasx = await AasxPackage.createFromFile(this.sourceFile);
        const env = await this.aasx.getEnvironment();
        if (env.assetAdministrationShells) {
            for (const shell of env.assetAdministrationShells) {
                let shellKey = await this.database.shells.findKey(shell.id);
                if (shellKey === undefined) {
                    shellKey = await this.addShell(shell);
                } else {
                    await this.updateShell(shellKey, shell);
                }

                newIndex.push([Table.AAS_TABLE, shellKey]);
            }
        }

        if (env.submodels) {
            for (const submodel of env.submodels) {
                let submodelKey = await this.database.submodels.findKey(submodel.id);
                if (submodelKey === undefined) {
                    submodelKey = await this.addSubmodel(submodel);
                } else {
                    await this.updateSubmodel(submodelKey, submodel);
                }

                newIndex.push([Table.SUBMODEL_TABLE, submodelKey]);
            }
        }

        if (env.conceptDescriptions) {
            for (const conceptDescription of env.conceptDescriptions) {
                let conceptDescriptionKey = await this.database.conceptDescriptions.findKey(conceptDescription.id);
                if (conceptDescriptionKey === undefined) {
                    conceptDescriptionKey = await this.addConceptDescription(conceptDescription);
                } else {
                    await this.updateConceptDescription(conceptDescriptionKey, conceptDescription);
                }

                newIndex.push([Table.CONCEPT_DESCRIPTION_TABLE, conceptDescriptionKey]);
            }
        }

        for (const [table, key] of oldIndex) {
            if (!newIndex.some(([t, k]) => table === t && key === k)) {
                this.packageIndex.remove(packageKey, table, key);
            }
        }
    }

    private async updateShell(key: DatabaseKey, shell: types.AssetAdministrationShell): Promise<void> {
        const table = this.database.shells;
        const assetIndex = this.database.assetIndex;
        const globalAssetId = await this.getGlobalAssetId(key);
        if (shell.assetInformation.globalAssetId !== globalAssetId) {
            if (globalAssetId !== null) {
                const assetKey = (await assetIndex.findKey(globalAssetId))!;
                await assetIndex.remove(assetKey, table.index, key);
            }
        }

        await table.update(key, toAssetAdministrationShell(shell), true);

        if (shell.assetInformation.globalAssetId !== globalAssetId) {
            if (shell.assetInformation.globalAssetId !== null) {
                let assetKey = await assetIndex.findKey(shell.assetInformation.globalAssetId);
                if (assetKey === undefined) {
                    assetKey = await assetIndex.create(shell.assetInformation.globalAssetId);
                }

                await assetIndex.add(assetKey, table, key);
            }
        }

        const thumbnail = await this.aasx.getThumbnailName();
        if (thumbnail) {
            await table.writeAsset(key, thumbnail, await this.aasx.getThumbnail());
        }

        await this.packageIndex.add(this.packageKey, table, key);
    }

    private async updateSubmodel(key: DatabaseKey, submodel: types.Submodel): Promise<void> {
        const table = this.database.submodels;
        await table.update(key, toSubmodel(submodel), true);
        for (const file of this.selectFiles(submodel)) {
            if (file.value) {
                try {
                    await table.writeAsset(key, file.value, this.aasx.read(file.value));
                } catch (error) {
                    noop(error);
                }
            }
        }

        await this.packageIndex.add(this.packageKey, table, key);
    }

    private async updateConceptDescription(
        key: DatabaseKey,
        conceptDescription: types.ConceptDescription,
    ): Promise<void> {
        const table = this.database.conceptDescriptions;
        await table.update(key, toConceptDescription(conceptDescription), true);
        await this.packageIndex.add(this.packageKey, table, key);
    }

    private async getGlobalAssetId(key: DatabaseKey): Promise<string | null> {
        const assetIndex = this.database.assetIndex;
        const refs = await this.database.shells.getIndexRefs(key, assetIndex.index);
        if (refs.length > 1) {
            throw new Error('Invalid operation.');
        }

        if (refs.length === 0) {
            return null;
        }

        return (await assetIndex.getItem(refs[0][1])).id;
    }
}
