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
import { PackageDescription, PagedResult, types } from 'aas-core';
import { FileResult } from 'aas-package';

import { Database } from './db/database.js';
import { Variable } from './variable.js';
import { LOGGER, Logger } from './logging/logger.js';
import { DatabaseEnvironment } from './db/database-types.js';
import { AddPackageCommand } from './db/commands/add-package-command.js';
import { UpdatePackageCommand } from './db/commands/update-package-command.js';
import { DeletePackageCommand } from './db/commands/delete-package-command.js';
import { HttpCache } from './http-cache.js';
import { AasxPackage } from './aasx-package.js';

@singleton()
export class PackageRepository {
    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(Variable) private readonly variable: Variable,
        @inject(Database) private readonly db: Database,
        @inject(HttpCache) private readonly cache: HttpCache,
    ) {}

    public async start(): Promise<void> {
        if ((await this.db.hasDatabase()) === false) {
            this.logger.info('No database, start import...');
            await this.import();
        }
    }

    public async getPackages(
        limit?: number,
        cursor?: string,
        aasId?: string,
    ): Promise<PagedResult<PackageDescription>> {
        const query = `?cursor=${cursor}&limit=${limit}&aasId=${aasId}`;
        let result = this.cache.getResult<PackageDescription>('/packages', query);
        if (!result) {
            result = await this.db.getPackages(limit, cursor, aasId);
            this.cache.setResult('/packages', query, result);
        }

        return result;
    }

    public async getPackage(packageId: string): Promise<FileResult> {
        const key = await this.db.packages.getKey(packageId);
        const item = await this.db.packages.getItem(key);
        const file = this.db.packages.getFilePath(key);
        const tmpFile = path.join(this.db.tmpDir, path.basename(file));
        await fs.promises.copyFile(file, tmpFile);
        const env = await this.createEnvironment(item.environment);
        const aasx = await AasxPackage.createFromFile(tmpFile);
        await aasx.setEnvironment(env);
        await aasx.save();

        const filename = item.filename;
        const value = item.filename;
        const readable = fs.createReadStream(tmpFile);
        const size = (await fs.promises.stat(tmpFile)).size;
        return { filename, value, readable, size };
    }

    public add(sourceFile: string, filename: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const command = new AddPackageCommand(this.db, resolve, reject, sourceFile, filename);
            this.db.execute(command);
            this.cache.clear();
        });
    }

    public async update(packageId: string, path: string, filename: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const command = new UpdatePackageCommand(this.db, resolve, reject, packageId, path, filename);
            this.db.execute(command);
            this.cache.clear();
        });
    }

    public async delete(packageId: string): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            const command = new DeletePackageCommand(this.db, resolve, reject, packageId);
            this.db.execute(command);
            this.cache.clear();
        });
    }

    private async import(): Promise<void> {
        const dir = path.join(this.variable.ASSETS, 'aasx');
        if (!fs.existsSync(dir)) {
            return;
        }

        const files = (await fs.promises.readdir(dir, { withFileTypes: true })).filter(
            entry => entry.isFile() && entry.name.endsWith('.aasx'),
        );

        try {
            await Promise.all(
                files.map(async file => {
                    try {
                        await this.add(path.join(file.parentPath, file.name), file.name);
                        this.logger.info(`${file.name} imported.`);
                    } catch (error) {
                        this.logger.error(error);
                    }
                }),
            );
        } catch (error) {
            this.logger.error(`Error during import: ${error}`);
        }
    }

    private async createEnvironment(item: DatabaseEnvironment): Promise<types.Environment> {
        const env = new types.Environment([], [], []);
        for (const key of item.assetAdministrationShells) {
            env.assetAdministrationShells!.push(await this.db.shells.readShell(key));
        }

        for (const key of item.submodels) {
            env.submodels!.push(await this.db.submodels.readSubmodel(key));
        }

        for (const key of item.conceptDescriptions) {
            env.conceptDescriptions!.push(await this.db.conceptDescriptions.readConceptDescription(key));
        }

        return env;
    }
}
