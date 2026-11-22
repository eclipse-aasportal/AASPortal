/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DatabaseSync } from 'node:sqlite';
import { isMainThread } from 'worker_threads';
import path from 'path';
import { singleton, Disposable, container } from 'tsyringe';
import { SqliteClient, SqliteHost, startSqliteHost } from 'aas-package';
import { Variable } from './variable.js';

@singleton()
export class SqliteConnectionProvider implements Disposable {
    private readonly variable = container.resolve(Variable);
    private readonly connections: Map<string, DatabaseSync> = new Map();
    private readonly clients = new Map<string, Promise<{ client: SqliteClient; stop?: () => Promise<void> }>>();

    public getConnection(url: string): DatabaseSync {
        const file = this.resolveFile(url);
        let db = this.connections.get(file);
        if (!db) {
            db = new DatabaseSync(file, { timeout: 5000 });
            db.exec('PRAGMA journal_mode = WAL');
            this.connections.set(file, db);
        }

        return db;
    }

    public getClient(url: string, endpoint: string): Promise<SqliteClient> {
        const file = this.resolveFile(url);
        let connection = this.clients.get(file);
        if (!connection) {
            connection = this.createClient(file, endpoint);
            this.clients.set(file, connection);
        }

        return connection.then(
            value => value.client,
            error => {
                if (this.clients.get(file) === connection) {
                    this.clients.delete(file);
                }

                throw error;
            },
        );
    }

    public async dispose(): Promise<void> {
        const clientConnections = await Promise.all(this.clients.values());
        for (const connection of clientConnections) {
            connection.client.close();
            await connection.stop?.();
        }

        for (const connection of this.connections.values()) {
            connection.close();
        }

        this.clients.clear();
        this.connections.clear();
    }

    private async createClient(
        file: string,
        endpoint: string,
    ): Promise<{ client: SqliteClient; stop?: () => Promise<void> }> {
        let host: SqliteHost | undefined;
        if (isMainThread) {
            host = await startSqliteHost(file, endpoint);
        }

        try {
            const client = await SqliteClient.connect(endpoint);
            await client.ping();
            return { client, stop: host?.stop };
        } catch (error) {
            await host?.stop();
            throw error;
        }
    }

    private resolveFile(url: string): string {
        return url === ':memory:' ? url : path.isAbsolute(url) ? url : path.join(this.variable.CONTENT_ROOT, url);
    }
}
