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

import { Stats, WebSocketData } from '../types.js';
import { Variable } from '../variable.js';
import { DatabaseData, Index, Table } from './database-types.js';
import { SubmodelTable } from './submodel-table.js';
import { ConceptDescriptionTable } from './concept-description-table.js';
import { AssetAdministrationShellTable } from './asset-administration-shell-table.js';
import { WSServer } from '../ws-server.js';
import { SocketClient } from '../socket-client.js';
import { DatabaseCommand } from './database-command.js';
import { DatabaseIndex } from './database-index.js';
import { DatabaseTable } from './database-table.js';
import { restoreDir, restoreFile } from '../utilities.js';

type Memento = {
    addedFiles?: string[];
    deletedFiles?: [string, string][];
    updatedFiles?: [string, string][];
    deletedDirs?: [string, string][];
    updatedDirs?: [string, string][];
};

type Connection = { data: DatabaseData };

const CAPACITY = 100;

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
     * Index for managing assets in the database.
     */
    public assetIndex!: DatabaseIndex;

    /**
     *Index for managing packages in the database.
     */
    public packageIndex!: DatabaseIndex;

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
    public fileDeleted(backup: string, file: string): void {
        if (this.memento?.deletedFiles === undefined) {
            throw new Error('Invalid operation.');
        }

        this.memento.deletedFiles.push([backup, file]);
    }

    /**
     * Marks a directory as deleted by adding its path to the `deletedDirs` array in the memento.
     * @param dir The path of the directory to mark as deleted.
     * @throws {Error} If the `deletedDirs` property in the memento is undefined.
     */
    public dirDeleted(backup: string, dir: string): void {
        if (this.memento?.deletedDirs === undefined) {
            throw new Error('Invalid operation.');
        }

        this.memento.deletedDirs.push([backup, dir]);
    }

    /**
     * Records an updated directory by storing a tuple containing the backup and directory paths
     * in the `updatedDirs` array of the `memento` object.
     *
     * This method is typically used during database operations that modify directory contents,
     * allowing the system to keep track of which directories were updated, as well as their
     * corresponding backup paths. This facilitates rollback or commit operations.
     *
     * @param backup - The path to the backup directory.
     * @param dir - The path to the updated directory.
     * @throws {Error} If the `updatedDirs` property of the memento is undefined.
     */
    public dirUpdated(backup: string, dir: string): void {
        if (this.memento?.updatedDirs === undefined) {
            throw new Error('Invalid operation.');
        }

        this.memento.updatedDirs.push([backup, dir]);
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
                shells: this.shells.size,
                submodels: this.submodels.size,
                conceptDescriptions: this.conceptDescriptions.size,
            } satisfies Stats,
        });
    }

    public getIndex(index: Index): DatabaseIndex {
        switch (index) {
            case Index.ASSET_INDEX:
                return this.assetIndex;
            case Index.PACKAGE_INDEX:
                return this.packageIndex;
            default:
                throw new Error('Invalid operation');
        }
    }

    public getTable(table: Table): DatabaseTable {
        switch (table) {
            case Table.AAS_TABLE:
                return this.shells;
            case Table.SUBMODEL_TABLE:
                return this.submodels;
            case Table.CONCEPT_DESCRIPTION_TABLE:
                return this.conceptDescriptions;
            default:
                throw new Error('Invalid operation');
        }
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
            deletedDirs: [],
            updatedDirs: [],
        };
    }

    private async commit(): Promise<void> {
        const data = (await this.connection).data;
        await this.shells.commit();
        await this.submodels.commit();
        await this.conceptDescriptions.commit();
        await this.assetIndex.commit();
        await this.packageIndex.commit();

        if (this.memento) {
            if (this.memento.deletedFiles) {
                await Promise.allSettled(this.memento.deletedFiles.map(([backup]) => fs.promises.unlink(backup)));
            }

            if (this.memento.updatedFiles) {
                await Promise.allSettled(this.memento.updatedFiles.map(([backup]) => fs.promises.unlink(backup)));
            }

            if (this.memento.deletedDirs) {
                await Promise.allSettled(
                    this.memento.deletedDirs.map(([backup]) => fs.promises.rm(backup, { recursive: true })),
                );
            }

            if (this.memento.updatedDirs) {
                await Promise.allSettled(
                    this.memento.updatedDirs.map(([backup]) => fs.promises.rm(backup, { recursive: true })),
                );
            }

            this.memento = undefined;
        }

        await this.write(data);
    }

    private async abort(): Promise<void> {
        const connection = await this.connection;
        connection.data = await this.read();
        await this.shells.abort();
        await this.submodels.abort();
        await this.conceptDescriptions.abort();
        await this.assetIndex.abort();
        await this.packageIndex.abort();

        if (this.memento) {
            if (this.memento.addedFiles) {
                await Promise.allSettled(this.memento.addedFiles.map(file => fs.promises.unlink(file)));
            }

            if (this.memento.deletedFiles) {
                await Promise.allSettled(this.memento.deletedFiles.map(([backup, file]) => restoreFile(backup, file)));
            }

            if (this.memento.updatedFiles) {
                await Promise.allSettled(this.memento.updatedFiles.map(([backup, file]) => restoreFile(backup, file)));
            }

            if (this.memento.updatedDirs) {
                await Promise.allSettled(this.memento.updatedDirs.map(([backup, dir]) => restoreDir(backup, dir)));
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
                version: '0.9',
                format: 'json',
                pageSize: this.variable.PAGE_SIZE,
                shells: {
                    nextKey: 0,
                    size: 0,
                    recycled: [],
                    capacity: CAPACITY,
                },
                submodels: {
                    nextKey: 0,
                    size: 0,
                    recycled: [],
                    capacity: CAPACITY,
                },
                conceptDescriptions: {
                    nextKey: 0,
                    size: 0,
                    recycled: [],
                    capacity: CAPACITY,
                },
                assetIndex: {
                    nextKey: 0,
                    size: 0,
                    recycled: [],
                    capacity: CAPACITY,
                },
                packageIndex: {
                    nextKey: 0,
                    size: 0,
                    recycled: [],
                    capacity: CAPACITY,
                },
            };

            await this.write(data);
        }

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

        const assetIndexDir = path.join(this.variable.DATA, 'asset-idx');
        if (!fs.existsSync(assetIndexDir)) {
            await fs.promises.mkdir(assetIndexDir);
        }

        this.assetIndex = new DatabaseIndex(
            Index.ASSET_INDEX,
            'AssetIndex',
            this,
            data.assetIndex,
            data.pageSize,
            assetIndexDir,
        );

        const packageIndexDir = path.join(this.variable.DATA, 'package-idx');
        if (!fs.existsSync(packageIndexDir)) {
            await fs.promises.mkdir(packageIndexDir);
        }

        this.packageIndex = new DatabaseIndex(
            Index.PACKAGE_INDEX,
            'PackageIndex',
            this,
            data.packageIndex,
            data.pageSize,
            packageIndexDir,
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
                    shells: this.shells.size,
                    submodels: this.submodels.size,
                    conceptDescriptions: this.conceptDescriptions.size,
                } satisfies Stats,
            });
        }
    };
}
