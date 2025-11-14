/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import path, { join } from 'path';
import fs from 'fs';

import { aas, PagedResult, noop, ApplicationError } from 'aas-core';
import { PackageDescription, Stats, WebSocketData } from '../types.js';
import { Variable } from '../variable.js';
import { ERROR } from '../error.js';
import { DatabaseData, DatabaseKey, PackageItem } from './database-types.js';
import { PackageTable } from './package-table.js';
import { SubmodelTable } from './submodel-table.js';
import { ConceptDescriptionTable } from './concept-description-table.js';
import { AssetAdministrationShellTable } from './asset-administration-shell-table.js';
import { WSServer } from '../ws-server.js';
import { SocketClient } from '../socket-client.js';
import { DatabaseCommand } from './database-command.js';

type Memento = {
    addedFiles?: string[];
    deletedFiles?: string[];
    updatedFiles?: [string, string][];
};

type Connection = { data: DatabaseData };

@singleton()
export class Database {
    private readonly connection: Promise<Connection>;
    private _hasDatabase = true;
    private memento?: Memento;
    private commandActive = false;
    private wsServer?: WSServer;

    public constructor(@inject(Variable) private readonly variable: Variable) {
        this.rootDir = this.variable.DATA;
        this.tmpDir = join(this.variable.DATA, 'tmp');
        this.connection = this.connect();
    }

    public readonly rootDir: string;

    public packages!: PackageTable;

    public shells!: AssetAdministrationShellTable;

    public submodels!: SubmodelTable;

    public conceptDescriptions!: ConceptDescriptionTable;

    public readonly tmpDir: string;

    public async ready(): Promise<void> {
        await this.connection;
    }

    public start(wsServer: WSServer): void {
        this.wsServer = wsServer;
        wsServer.on('message', this.wsServerOnMessage);
    }

    public async hasDatabase(): Promise<boolean> {
        await this.connection;
        return this._hasDatabase;
    }

    public async begin(): Promise<void> {
        if (this.commandActive) {
            throw new Error('Command already active.');
        }

        this.commandActive = true;
        await this.connection;
        this.memento = {
            addedFiles: [],
            deletedFiles: [],
            updatedFiles: [],
        };
    }

    public async commit(): Promise<void> {
        if (!this.commandActive) {
            throw new Error('No command active.');
        }

        const data = (await this.connection).data;
        await this.packages.commit();
        await this.shells.commit();
        await this.submodels.commit();
        await this.conceptDescriptions.commit();

        if (this.memento) {
            if (this.memento.deletedFiles) {
                for (const deletedFile of this.memento.deletedFiles) {
                    try {
                        await fs.promises.unlink(deletedFile);
                    } catch {
                        noop();
                    }
                }
            }

            if (this.memento.updatedFiles) {
                for (const [backup] of this.memento.updatedFiles) {
                    try {
                        await fs.promises.unlink(backup);
                    } catch {
                        noop();
                    }
                }
            }

            this.memento = undefined;
        }

        await this.write(data);
        this.commandActive = false;
    }

    public async abort(): Promise<void> {
        if (!this.commandActive) {
            return;
        }

        const connection = await this.connection;
        connection.data = await this.read();
        await this.packages.abort();
        await this.shells.abort();
        await this.submodels.abort();
        await this.conceptDescriptions.abort();
        if (this.memento) {
            if (this.memento.addedFiles) {
                for (const addedFile of this.memento.addedFiles) {
                    try {
                        await fs.promises.unlink(addedFile);
                    } catch {
                        noop();
                    }
                }

                if (this.memento.updatedFiles) {
                    for (const [backup, dest] of this.memento.updatedFiles) {
                        try {
                            await fs.promises.copyFile(backup, dest);
                            await fs.promises.unlink(backup);
                        } catch {
                            noop();
                        }
                    }
                }
            }

            this.memento = undefined;
        }

        this.commandActive = false;
    }

    public async execute<TResult>(command: DatabaseCommand<TResult>): Promise<TResult> {
        try {
            await this.begin();
            const result = await command.execute();
            await this.commit();
            this.notifyStatsChanged();
            return result;
        } catch (error) {
            await this.abort();
            throw error;
        }
    }

    public fileAdded(file: string): void {
        if (this.memento?.addedFiles === undefined) {
            throw new Error('Invalid operation.');
        }

        this.memento.addedFiles.push(file);
    }

    public fileUpdated(backup: string, file: string): void {
        if (this.memento?.updatedFiles === undefined) {
            throw new Error('Invalid operation.');
        }

        this.memento.updatedFiles.push([backup, file]);
    }

    public fileDeleted(file: string): void {
        if (this.memento?.deletedFiles === undefined) {
            throw new Error('Invalid operation.');
        }

        this.memento.deletedFiles.push(file);
    }

    public async getPackages(
        limit?: number,
        cursor?: string,
        aasId?: string,
    ): Promise<PagedResult<PackageDescription>> {
        await this.connection;
        let aasKey: DatabaseKey | undefined;
        if (aasId) {
            aasKey = await this.shells.getKey(aasId);
        }

        return await this.packages.getPage(limit ?? this.variable.LIMIT, cursor, (item: PackageItem) => {
            return aasKey === undefined || item.environment.assetAdministrationShells.indexOf(aasKey) >= 0;
        });
    }

    public async getShells(limit?: number, cursor?: string): Promise<PagedResult<aas.AssetAdministrationShell>> {
        await this.connection;
        return await this.shells.getPage(limit ?? this.variable.LIMIT, cursor);
    }

    public async getShell(id: string): Promise<aas.AssetAdministrationShell> {
        await this.connection;
        const key = await this.shells.getKey(id);
        return await this.shells.readJson(key);
    }

    public async getSubmodels(limit?: number, cursor?: string): Promise<PagedResult<aas.Submodel>> {
        await this.connection;
        return await this.submodels.getPage(limit ?? this.variable.LIMIT, cursor);
    }

    public async getSubmodel(id: string): Promise<aas.Submodel> {
        await this.connection;
        const key = await this.submodels.findKey(id);
        if (key === undefined) {
            throw new ApplicationError(ERROR.SUBMODEL_DOES_NOT_EXIST, { id }, 404);
        }

        return await this.submodels.readJson(key);
    }

    public async getConceptDescriptions(limit?: number, cursor?: string): Promise<PagedResult<aas.ConceptDescription>> {
        await this.connection;
        return await this.conceptDescriptions.getPage(limit ?? this.variable.LIMIT, cursor);
    }

    public async getConceptDescription(id: string): Promise<aas.Submodel> {
        await this.connection;
        const key = await this.conceptDescriptions.findKey(id);
        if (key === undefined) {
            throw new ApplicationError(ERROR.CONCEPT_DESCRIPTION_DOES_NOT_EXIST, { id }, 404);
        }

        return await this.conceptDescriptions.readJson(key);
    }

    public notifyStatsChanged(): void {
        this.wsServer?.notify({
            type: 'stats',
            data: {
                packages: this.packages.size,
                shells: this.shells.size,
                submodels: this.submodels.size,
                conceptDescriptions: this.conceptDescriptions.size,
            } satisfies Stats,
        });
    }

    private async connect(): Promise<Connection> {
        if (!fs.existsSync(this.variable.DATA)) {
            this._hasDatabase = false;
            await fs.promises.mkdir(this.variable.DATA);
        }

        if (!fs.existsSync(this.tmpDir)) {
            await fs.promises.mkdir(this.tmpDir);
        }

        const file = path.join(this.variable.DATA, 'db.json');
        let data: DatabaseData;
        if (fs.existsSync(file)) {
            data = JSON.parse((await fs.promises.readFile(file)).toString());
        } else {
            data = {
                pageSize: this.variable.PAGE_SIZE,
                packages: {
                    nextKey: 0,
                    size: 0,
                    recycled: [],
                    capacity: 100,
                },
                shells: {
                    nextKey: 0,
                    size: 0,
                    recycled: [],
                    capacity: 100,
                },
                submodels: {
                    nextKey: 0,
                    size: 0,
                    recycled: [],
                    capacity: 100,
                },
                conceptDescriptions: {
                    nextKey: 0,
                    size: 0,
                    recycled: [],
                    capacity: 100,
                },
            };

            await this.write(data);
        }

        const packageDir = path.join(this.variable.DATA, 'packages');
        if (!fs.existsSync(packageDir)) {
            await fs.promises.mkdir(packageDir);
        }

        this.packages = new PackageTable(this, data.packages, data.pageSize, packageDir);

        const shellDir = path.join(this.variable.DATA, 'shells');
        if (!fs.existsSync(shellDir)) {
            await fs.promises.mkdir(shellDir);
        }

        this.shells = new AssetAdministrationShellTable(this, data.shells, data.pageSize, shellDir);

        const submodelDir = path.join(this.variable.DATA, 'submodels');
        if (!fs.existsSync(submodelDir)) {
            await fs.promises.mkdir(submodelDir);
        }

        this.submodels = new SubmodelTable(this, data.submodels, data.pageSize, submodelDir);

        const conceptDescriptionDir = path.join(this.variable.DATA, 'conceptDescriptions');
        if (!fs.existsSync(conceptDescriptionDir)) {
            await fs.promises.mkdir(conceptDescriptionDir);
        }

        this.conceptDescriptions = new ConceptDescriptionTable(
            this,
            data.conceptDescriptions,
            data.pageSize,
            conceptDescriptionDir,
        );

        return { data };
    }

    private async read(): Promise<DatabaseData> {
        const file = path.join(this.variable.DATA, 'db.json');
        return JSON.parse((await fs.promises.readFile(file)).toString());
    }

    private async write(data: DatabaseData): Promise<void> {
        const file = path.join(this.variable.DATA, 'db.json');
        return fs.promises.writeFile(file, JSON.stringify(data));
    }

    private wsServerOnMessage = (data: WebSocketData, client: SocketClient): void => {
        if (data.type === 'getStats') {
            client.notify({
                type: 'stats',
                data: {
                    packages: this.packages.size,
                    shells: this.shells.size,
                    submodels: this.submodels.size,
                    conceptDescriptions: this.conceptDescriptions.size,
                } satisfies Stats,
            });
        }
    };
}
