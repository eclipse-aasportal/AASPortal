/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import fs from 'fs';
import { PagedResult, types } from 'aas-core';

import { inject, singleton } from 'tsyringe';
import { AasxPackage } from './aasx-package.js';
import { Database } from './data/database.js';
import { Variable } from './variable.js';
import { FileResult, PackageDescription } from './types.js';
import { LOGGER, Logger } from './logging/logger.js';
import { DatabaseEnvironment } from './data/database-types.js';
import { AddPackageCommand } from './data/commands/add-package-command.js';
import { UpdatePackageCommand } from './data/commands/update-package-command.js';
import { DeletePackageCommand } from './data/commands/delete-package-command.js';
import { HttpCache } from './http-cache.js';

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
        const aasx = new AasxPackage(tmpFile);
        await aasx.setEnvironment(env);
        await aasx.save();

        const filename = item.filename;
        const readable = fs.createReadStream(tmpFile);
        const size = (await fs.promises.stat(tmpFile)).size;
        return { filename, readable, size };
    }

    public async add(sourceFile: string, filename: string): Promise<string> {
        const command = new AddPackageCommand(this.db, sourceFile, filename);
        const result = await this.db.execute(command);
        this.cache.remove('/packages');
        return result;
    }

    public async update(packageId: string, path: string, filename: string): Promise<void> {
        const aasx = new AasxPackage(path);
        const env = await aasx.getEnvironment();
        const command = new UpdatePackageCommand(this.db, packageId, path, filename, env);
        await this.db.execute(command);
        this.cache.remove('/packages');
    }

    public async delete(packageId: string): Promise<void> {
        const command = new DeletePackageCommand(this.db, packageId);
        await this.db.execute(command);
        this.cache.remove('/packages');
    }

    private async import(): Promise<void> {
        const dir = path.join(this.variable.ASSETS, 'aasx');
        if (!fs.existsSync(dir)) {
            return;
        }

        for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
            if (entry.isFile() && entry.name.endsWith('.aasx')) {
                try {
                    await this.add(path.join(entry.path, entry.name), entry.name);
                    this.logger.info(`${entry.name} imported.`);
                } catch (error) {
                    this.logger.error(error);
                }
            }
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
