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

import { aas, PagedResult, noop, ApplicationError, PackageDescription } from 'aas-core';
import { Stats, WebSocketData } from '../types.js';
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

/**
 * Database class for managing AAS data storage and retrieval.
 */
@singleton()
export class Database {
    private readonly commandQueue: DatabaseCommand[] = [];
    private readonly connection: Promise<Connection>;
    private _hasDatabase = true;
    private memento?: Memento;
    private wsServer?: WSServer;

    public constructor(@inject(Variable) private readonly variable: Variable) {
        this.rootDir = this.variable.DATA;
        this.tmpDir = join(this.variable.DATA, 'tmp');
        this.connection = this.connect();
    }

    /**
     * The root directory where the database files are stored.
     */
    public readonly rootDir: string;

    /**
     * Table for managing packages in the database.
     */
    public packages!: PackageTable;

    /**
     * Table for managing Asset Administration Shells in the database.
     */
    public shells!: AssetAdministrationShellTable;

    /**
     * Table for managing submodels in the database.
     */
    public submodels!: SubmodelTable;

    /**
     * Table for managing concept descriptions in the database.
     */
    public conceptDescriptions!: ConceptDescriptionTable;

    /**
     * Temporary directory for intermediate file storage.
     */
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

    /**
     * Adds a database command to the execution queue and initiates its execution if the queue was previously empty.
     *
     * @param command - The database command to be executed.
     *
     * If the command queue is empty before adding the new command, this method immediately starts executing the command.
     * Otherwise, the command will be executed once all previously queued commands have completed.
     */
    public execute(command: DatabaseCommand): void {
        this.commandQueue.push(command);
        if (this.commandQueue.length === 1) {
            this.executeCommand();
        }
    }

    /**
     * Adds a file to the list of added files in the memento.
     *
     * @param file - The path or identifier of the file to add.
     * @throws {Error} If the `addedFiles` property of the memento is undefined.
     */
    public fileAdded(file: string): void {
        if (this.memento?.addedFiles === undefined) {
            throw new Error('Invalid operation.');
        }

        this.memento.addedFiles.push(file);
    }

    /**
     * Records an updated file by adding a tuple containing the backup and file paths
     * to the `updatedFiles` array in the `memento` object.
     *
     * @param backup - The path to the backup file.
     * @param file - The path to the updated file.
     * @throws {Error} If the `updatedFiles` property of `memento` is undefined.
     */
    public fileUpdated(backup: string, file: string): void {
        if (this.memento?.updatedFiles === undefined) {
            throw new Error('Invalid operation.');
        }

        this.memento.updatedFiles.push([backup, file]);
    }

    /**
     * Marks a file as deleted by adding its name to the `deletedFiles` array in the memento.
     *
     * @param file - The name or path of the file to mark as deleted.
     * @throws {Error} If the `deletedFiles` property in the memento is undefined.
     */
    public fileDeleted(file: string): void {
        if (this.memento?.deletedFiles === undefined) {
            throw new Error('Invalid operation.');
        }

        this.memento.deletedFiles.push(file);
    }

    /**
     * Retrieves a paginated list of package descriptions, optionally filtered by Asset Administration Shell (AAS) ID.
     *
     * @param limit - The maximum number of packages to return. If not provided, a default limit is used.
     * @param cursor - An optional cursor for pagination, indicating the starting point for the next page of results.
     * @param aasId - An optional Asset Administration Shell ID to filter packages associated with a specific AAS.
     * @returns A promise that resolves to a paged result containing package descriptions.
     */
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

    /**
     * Retrieves a paginated list of Asset Administration Shells.
     *
     * @param limit - Optional. The maximum number of shells to return. Defaults to a predefined limit if not specified.
     * @param cursor - Optional. A pagination cursor indicating the starting point for the next set of results.
     * @returns A promise that resolves to a paged result containing Asset Administration Shells.
     */
    public async getShells(limit?: number, cursor?: string): Promise<PagedResult<aas.AssetAdministrationShell>> {
        await this.connection;
        return await this.shells.getPage(limit ?? this.variable.LIMIT, cursor);
    }

    /**
     * Retrieves an Asset Administration Shell (AAS) by its unique identifier.
     *
     * @param id - The unique identifier of the Asset Administration Shell to retrieve.
     * @returns A promise that resolves to the requested Asset Administration Shell object.
     * @throws Will throw an error if the shell cannot be found or if there is a database access issue.
     */
    public async getShell(id: string): Promise<aas.AssetAdministrationShell> {
        await this.connection;
        const key = await this.shells.getKey(id);
        return await this.shells.readJson(key);
    }

    /**
     * Retrieves a paginated list of submodels from the database.
     *
     * @param limit - Optional. The maximum number of submodels to return. If not provided, a default limit is used.
     * @param cursor - Optional. A pagination cursor indicating the starting point for the next set of results.
     * @returns A promise that resolves to a paged result containing submodels.
     */
    public async getSubmodels(limit?: number, cursor?: string): Promise<PagedResult<aas.Submodel>> {
        await this.connection;
        return await this.submodels.getPage(limit ?? this.variable.LIMIT, cursor);
    }

    /**
     * Retrieves a submodel by its unique identifier.
     *
     * @param id - The unique identifier of the submodel to retrieve.
     * @returns A promise that resolves to the requested {@link aas.Submodel}.
     * @throws {@link ApplicationError} If the submodel does not exist, with error code {@link ERROR.SUBMODEL_DOES_NOT_EXIST} and HTTP status 404.
     */
    public async getSubmodel(id: string): Promise<aas.Submodel> {
        await this.connection;
        const key = await this.submodels.findKey(id);
        if (key === undefined) {
            throw new ApplicationError(ERROR.SUBMODEL_DOES_NOT_EXIST, { id }, 404);
        }

        return await this.submodels.readJson(key);
    }

    /**
     * Retrieves a paginated list of ConceptDescription objects from the database.
     *
     * @param limit - Optional. The maximum number of ConceptDescription items to return. If not provided, a default limit is used.
     * @param cursor - Optional. A pagination cursor indicating the starting point for the next page of results.
     * @returns A promise that resolves to a PagedResult containing ConceptDescription objects.
     */
    public async getConceptDescriptions(limit?: number, cursor?: string): Promise<PagedResult<aas.ConceptDescription>> {
        await this.connection;
        return await this.conceptDescriptions.getPage(limit ?? this.variable.LIMIT, cursor);
    }

    /**
     * Retrieves a concept description by its identifier.
     *
     * @param id - The unique identifier of the concept description to retrieve.
     * @returns A promise that resolves to the corresponding `aas.Submodel` object.
     * @throws {ApplicationError} If the concept description does not exist, with error code `ERROR.CONCEPT_DESCRIPTION_DOES_NOT_EXIST` and HTTP status 404.
     */
    public async getConceptDescription(id: string): Promise<aas.Submodel> {
        await this.connection;
        const key = await this.conceptDescriptions.findKey(id);
        if (key === undefined) {
            throw new ApplicationError(ERROR.CONCEPT_DESCRIPTION_DOES_NOT_EXIST, { id }, 404);
        }

        return await this.conceptDescriptions.readJson(key);
    }

    /**
     * Notifies connected WebSocket clients that the statistics have changed.
     *
     * Sends a message of type `'stats'` containing the current counts of packages,
     * shells, submodels, and concept descriptions. The message is only sent if the
     * WebSocket server (`wsServer`) is available.
     *
     * @remarks
     * The data sent conforms to the `Stats` interface.
     */
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

    private async executeCommand(): Promise<void> {
        while (this.commandQueue.length > 0) {
            const command = this.commandQueue.at(0);
            if (!command) {
                return;
            }

            try {
                await this.begin();
                const result = await command.execute();
                await this.commit();
                this.notifyStatsChanged();
                command.resolve(result);
            } catch (error) {
                await this.abort();
                command.reject(error);
            }

            this.commandQueue.shift();
        }
    }

    private async begin(): Promise<void> {
        await this.connection;
        this.memento = {
            addedFiles: [],
            deletedFiles: [],
            updatedFiles: [],
        };
    }

    private async commit(): Promise<void> {
        const data = (await this.connection).data;
        await this.packages.commit();
        await this.shells.commit();
        await this.submodels.commit();
        await this.conceptDescriptions.commit();

        if (this.memento) {
            if (this.memento.deletedFiles) {
                Promise.all(
                    this.memento.deletedFiles.map(async deletedFile => {
                        try {
                            await fs.promises.unlink(deletedFile);
                        } catch {
                            noop();
                        }
                    }),
                );
            }

            if (this.memento.updatedFiles) {
                Promise.all(
                    this.memento.updatedFiles.map(async ([backup]) => {
                        try {
                            await fs.promises.unlink(backup);
                        } catch {
                            noop();
                        }
                    }),
                );
            }

            this.memento = undefined;
        }

        await this.write(data);
    }

    private async abort(): Promise<void> {
        const connection = await this.connection;
        connection.data = await this.read();
        await this.packages.abort();
        await this.shells.abort();
        await this.submodels.abort();
        await this.conceptDescriptions.abort();
        if (this.memento) {
            if (this.memento.addedFiles) {
                Promise.all(
                    this.memento.addedFiles.map(async addedFile => {
                        try {
                            await fs.promises.unlink(addedFile);
                        } catch {
                            noop();
                        }
                    }),
                );

                if (this.memento.updatedFiles) {
                    Promise.all(
                        this.memento.updatedFiles.map(async ([backup, dest]) => {
                            try {
                                await fs.promises.copyFile(backup, dest);
                                await fs.promises.unlink(backup);
                            } catch {
                                noop();
                            }
                        }),
                    );
                }
            }

            this.memento = undefined;
        }
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
