/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import fs from 'fs';
import { inject, singleton } from 'tsyringe';
import {
    noop,
    PackageDescription,
    PagedResult,
    types,
    ApplicationError,
    fromAssetAdministrationShell,
    fromSubmodel,
    fromConceptDescription,
} from 'aas-core';

import { FileResult } from 'aas-package';

import { Database } from './db/database.js';
import { Variable } from './variable.js';
import { LOGGER, Logger } from './logging/logger.js';
import { AddPackageCommand } from './db/commands/add-package-command.js';
import { UpdatePackageCommand } from './db/commands/update-package-command.js';
import { DeletePackageCommand } from './db/commands/delete-package-command.js';
import { AasxPackageBuilder } from './aasx-package-builder.js';
import { ERROR } from './error.js';
import { Table } from './db/database-types.js';
import { getFiles } from './utilities.js';

@singleton()
export class PackageRepository {
    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(Variable) private readonly variable: Variable,
        @inject(Database) private readonly db: Database,
        @inject(AasxPackageBuilder) private readonly aasxBuilder: AasxPackageBuilder,
    ) {}

    public async start(): Promise<void> {
        if ((await this.db.hasDatabase()) === false) {
            this.logger.info('No database, start import...');
            await this.import();
        }
    }

    public async getPackages(
        limit: number = 100,
        cursor?: string,
        aasId?: string,
    ): Promise<PagedResult<PackageDescription>> {
        noop(aasId);
        const start = cursor ? JSON.parse(cursor) : 0;
        const result: PackageDescription[] = [];
        for await (const item of this.db.packageIndex.getItems(start)) {
            if (result.length >= limit) {
                return { result, paging_metadata: { cursor: JSON.stringify(item.key) } };
            }

            const aasIds: string[] = [];
            for (const [table, key] of item.tableRefs) {
                const linkedItem = await this.db.getTable(table).get(key);
                if (linkedItem) {
                    aasIds.push(linkedItem.id);
                }
            }

            result.push({ packageId: item.id, aasIds });
        }

        return { result, paging_metadata: {} };
    }

    public async getPackage(packageId: string): Promise<FileResult> {
        const key = await this.db.packageIndex.findKey(packageId);
        if (key === undefined) {
            throw new ApplicationError(ERROR.INVALID_PACKAGE_ID, {}, 400);
        }

        const item = await this.db.packageIndex.getItem(key);
        const filename = item.filename ? String(item.filename) : `${item.id}.aasx`;
        const tmpFile = path.join(this.db.tmpDir, filename);

        const shells: types.AssetAdministrationShell[] = [];
        const submodels: types.Submodel[] = [];
        const conceptDescriptions: types.ConceptDescription[] = [];
        for (const [table, key] of item.tableRefs) {
            switch (table) {
                case Table.AAS_TABLE:
                    shells.push(fromAssetAdministrationShell(await this.db.shells.readObject(key)));
                    break;
                case Table.SUBMODEL_TABLE:
                    submodels.push(fromSubmodel(await this.db.submodels.readObject(key)));
                    break;
                case Table.CONCEPT_DESCRIPTION_TABLE:
                    conceptDescriptions.push(fromConceptDescription(await this.db.conceptDescriptions.readObject(key)));
                    break;
            }
        }

        const aasx = await this.aasxBuilder.build(
            tmpFile,
            new types.Environment(shells, submodels, conceptDescriptions),
        );

        for (const shell of shells) {
            const key = await this.db.shells.getKey(shell.id);
            const dir = this.db.shells.getAssetsDir(key);
            const files = await getFiles(dir);
            for (const file of files) {
                const filePath = path.join(file.parentPath, file.name);
                const name = path.relative(dir, filePath);
                await aasx.write(name, fs.createReadStream(filePath));
            }
        }

        for (const submodel of submodels) {
            const key = await this.db.submodels.getKey(submodel.id);
            const dir = this.db.submodels.getAssetsDir(key);
            const files = await getFiles(dir);
            for (const file of files) {
                const filePath = path.join(file.parentPath, file.name);
                const name = path.relative(dir, filePath);
                await aasx.write(name, fs.createReadStream(filePath));
            }
        }

        const readable = fs.createReadStream(tmpFile);
        const size = (await fs.promises.stat(tmpFile)).size;
        return { filename, value: filename, readable, size };
    }

    public add(sourceFile: string, filename: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const command = new AddPackageCommand(this.db, resolve, reject, sourceFile, filename);
            this.db.execute(command);
        });
    }

    public async update(packageId: string, path: string, filename: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const command = new UpdatePackageCommand(this.db, resolve, reject, packageId, path, filename);
            this.db.execute(command);
        });
    }

    public async delete(packageId: string): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            const command = new DeletePackageCommand(this.db, resolve, reject, packageId);
            this.db.execute(command);
        });
    }

    private async import(): Promise<void> {
        const dir = path.join(this.variable.ASSETS, 'aasx');
        if (!fs.existsSync(dir)) {
            return;
        }

        const files = await getFiles(dir);
        for (const file of files) {
            if (file.name.endsWith('.aasx')) {
                try {
                    await this.add(path.join(file.parentPath, file.name), file.name);
                    this.logger.info(`${file.name} imported.`);
                } catch (error) {
                    this.logger.error(error);
                }
            }
        }
    }
}
