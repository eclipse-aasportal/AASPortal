/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { DatabaseSync, SQLInputValue, SQLOutputValue, StatementSync } from 'node:sqlite';
import { nanoid } from 'nanoid';
import { LOGGER } from 'aas-package';
import {
    AASEndpoint,
    AASCursor,
    AASPagedResult,
    PagedResult,
    AASDocument,
    ApplicationError,
    AASEndpointType,
    AASDocumentId,
    aas,
    flat,
    isIdentifiable,
    baseType,
    isProperty,
    parseNumber,
    parseDate,
    isValidDate,
    toBoolean,
    isMultiLanguageProperty,
    isFile,
    isBlob,
    FilterExpressionParser,
} from 'aas-core';

import { AASIndex, toAbbreviation, toDocumentId } from './aas-index.js';
import { ERRORS } from '../errors.js';
import { Variable } from '../variable.js';
import { SqliteConnectionProvider } from '../sqlite-connection-provider.js';
import { getWhereClause } from './get-where-clause.js';

const LIMIT = 100;

const initDatabase = `
CREATE TABLE IF NOT EXISTS endpoints (
    name TEXT PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    version TEXT,
    headers TEXT,
    schedule TEXT
);

CREATE TABLE IF NOT EXISTS documents (
    uuid TEXT PRIMARY KEY,
    address TEXT NOT NULL, 
    endpoint TEXT NOT NULL REFERENCES endpoints(name) ON DELETE CASCADE,
    id TEXT NOT NULL, 
    idShort TEXT NOT NULL, 
    assetId TEXT,
    thumbnail TEXT, 
    timestamp INTEGER NOT NULL,
    UNIQUE (endpoint, id)
);

CREATE INDEX IF NOT EXISTS idx_doc_endpoint_id ON documents(endpoint, id);

CREATE TABLE IF NOT EXISTS elements (
    uuid TEXT NOT NULL REFERENCES documents(uuid) ON DELETE CASCADE,
    modelType TEXT NOT NULL,
    id TEXT,
    idShort TEXT NOT NULL,
    stringValue TEXT,
    numberValue REAL,
    bigintValue TEXT,
    dateValue TEXT,
    booleanValue INTEGER
);

CREATE TABLE IF NOT EXISTS submodelConceptDescriptions (
    endpoint TEXT NOT NULL REFERENCES endpoints(name) ON DELETE CASCADE,
    id TEXT NOT NULL,
    conceptDescriptionIds TEXT NOT NULL,
    PRIMARY KEY (endpoint, id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(idShort, id, assetId);
CREATE VIRTUAL TABLE IF NOT EXISTS elements_fts USING fts5(id, idShort, stringValue);

CREATE TRIGGER IF NOT EXISTS documents_fts_ai AFTER INSERT ON documents BEGIN
    INSERT INTO documents_fts(rowid, idShort, id, assetId)
    VALUES (new.rowid, fold(new.idShort), fold(new.id), fold(new.assetId));
END;

CREATE TRIGGER IF NOT EXISTS documents_fts_ad AFTER DELETE ON documents BEGIN
    DELETE FROM documents_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS documents_fts_au AFTER UPDATE ON documents BEGIN
    DELETE FROM documents_fts WHERE rowid = old.rowid;
    INSERT INTO documents_fts(rowid, idShort, id, assetId)
    VALUES (new.rowid, fold(new.idShort), fold(new.id), fold(new.assetId));
END;

CREATE TRIGGER IF NOT EXISTS elements_fts_ai AFTER INSERT ON elements BEGIN
    INSERT INTO elements_fts(rowid, id, idShort, stringValue)
    VALUES (new.rowid, fold(new.id), fold(new.idShort), fold(new.stringValue));
END;

CREATE TRIGGER IF NOT EXISTS elements_fts_ad AFTER DELETE ON elements BEGIN
    DELETE FROM elements_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS elements_fts_au AFTER UPDATE ON elements BEGIN
    DELETE FROM elements_fts WHERE rowid = old.rowid;
    INSERT INTO elements_fts(rowid, id, idShort, stringValue)
    VALUES (new.rowid, fold(new.id), fold(new.idShort), fold(new.stringValue));
END;
`;

function fold(value: SQLInputValue, locale: string = 'en'): string | null {
    if (!value || typeof value !== 'string') {
        return null;
    }

    return value.normalize('NFKC').toLocaleLowerCase(locale);
}

@singleton()
export class SqliteIndex implements AASIndex {
    private readonly logger = container.resolve(LOGGER);
    private readonly variable = container.resolve(Variable);
    private readonly connectionProvider = container.resolve(SqliteConnectionProvider);

    private readonly db: DatabaseSync;
    private readonly getCountAll: StatementSync;
    private readonly getCountEndpoint: StatementSync;
    private readonly getEndpointsSql: StatementSync;
    private readonly getEndpointCountSql: StatementSync;
    private readonly insertEndpointSql: StatementSync;
    private readonly getEndpointSql: StatementSync;
    private readonly updateEndpointSql: StatementSync;
    private readonly deleteEndpointSql: StatementSync;
    private readonly getDocumentAASSql: StatementSync;
    private readonly getDocumentAssetSql: StatementSync;
    private readonly getEndpointDocumentAASSql: StatementSync;
    private readonly getEndpointDocumentAssetSql: StatementSync;
    private readonly selectDocumentSql: StatementSync;
    private readonly insertDocumentSql: StatementSync;
    private readonly deleteDocumentSql: StatementSync;
    private readonly updateDocumentSql: StatementSync;
    private readonly deleteElementsSql: StatementSync;
    private readonly insertElementSql: StatementSync;
    private readonly selectUuidSql: StatementSync;
    private readonly selectEndpointDocumentsSql: StatementSync;
    private readonly deleteEndpointDocumentsSql: StatementSync;
    private readonly deleteAllDocumentsSql: StatementSync;
    private readonly getConceptDescriptionIdsSql: StatementSync;
    private readonly insertConceptDescriptionIdsSql: StatementSync;
    private readonly updateConceptDescriptionIdsSql: StatementSync;
    private readonly deleteConceptDescriptionIdsSql: StatementSync;
    private readonly deleteEndpointConceptDescriptionIdsSql: StatementSync;

    public constructor() {
        this.db = this.connectionProvider.getConnection(this.variable.AAS_INDEX);
        this.db.exec('PRAGMA journal_mode = WAL');
        this.db.exec('PRAGMA foreign_keys = ON');
        this.db.exec('PRAGMA synchronous = NORMAL');

        this.db.function('fold', { deterministic: true }, (value: SQLInputValue): SQLOutputValue => fold(value));
        this.db.exec(initDatabase);

        this.getCountAll = this.db.prepare('SELECT COUNT(*) FROM documents');
        this.getCountEndpoint = this.db.prepare('SELECT COUNT(*) FROM documents WHERE endpoint = ?');
        this.getEndpointsSql = this.db.prepare('SELECT * FROM endpoints');
        this.getEndpointCountSql = this.db.prepare('SELECT COUNT(*) FROM endpoints AS count');
        this.insertEndpointSql = this.db.prepare(
            'INSERT INTO endpoints (name, url, type, version, headers, schedule) VALUES (?, ?, ?, ?, ?, ?)',
        );

        this.getEndpointSql = this.db.prepare('SELECT * FROM endpoints WHERE name = ?');
        this.updateEndpointSql = this.db.prepare(
            'UPDATE endpoints SET url = ?, type = ?, version = ?, headers = ?, schedule = ? WHERE name = ?',
        );

        this.deleteEndpointSql = this.db.prepare('DELETE FROM endpoints WHERE name = ?');
        this.selectDocumentSql = this.db.prepare('SELECT uuid FROM documents WHERE endpoint = ? AND id = ?');
        this.updateDocumentSql = this.db.prepare(
            'UPDATE documents SET address = ?, idShort = ?, assetId = ?, timestamp = ?, thumbnail = ? WHERE uuid = ?',
        );

        this.deleteElementsSql = this.db.prepare('DELETE FROM elements WHERE uuid = ?');
        this.insertElementSql = this.db.prepare(
            'INSERT INTO elements (uuid, modelType, id, idShort, stringValue, numberValue, dateValue, booleanValue, bigintValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        );

        this.insertDocumentSql = this.db.prepare(
            'INSERT INTO documents (uuid, address, endpoint, id, idShort, assetId, thumbnail, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        );

        this.getEndpointDocumentAASSql = this.db.prepare('SELECT * FROM documents WHERE endpoint = ? AND id = ?');
        this.getEndpointDocumentAssetSql = this.db.prepare(
            'SELECT * FROM documents WHERE endpoint = ? AND assetId = ?',
        );

        this.getDocumentAASSql = this.db.prepare('SELECT * FROM documents WHERE id = ?');
        this.getDocumentAssetSql = this.db.prepare('SELECT * FROM documents WHERE assetId = ?');
        this.deleteDocumentSql = this.db.prepare('DELETE FROM documents WHERE uuid = ?');
        this.selectUuidSql = this.db.prepare('SELECT uuid FROM documents WHERE endpoint = ? AND id = ?');
        this.deleteAllDocumentsSql = this.db.prepare('DELETE FROM documents');
        this.selectEndpointDocumentsSql = this.db.prepare('SELECT uuid FROM documents WHERE endpoint = ?');
        this.deleteEndpointDocumentsSql = this.db.prepare('DELETE FROM documents WHERE endpoint = ?');
        this.getConceptDescriptionIdsSql = this.db.prepare(
            'SELECT conceptDescriptionIds FROM submodelConceptDescriptions WHERE endpoint = ? AND id = ?',
        );

        this.insertConceptDescriptionIdsSql = this.db.prepare(
            'INSERT INTO submodelConceptDescriptions (endpoint, id, conceptDescriptionIds) VALUES (?, ?, ?)',
        );

        this.updateConceptDescriptionIdsSql = this.db.prepare(
            'UPDATE submodelConceptDescriptions SET conceptDescriptionIds = ? WHERE endpoint = ? AND id = ?',
        );

        this.deleteConceptDescriptionIdsSql = this.db.prepare('DELETE FROM submodelConceptDescriptions');
        this.deleteEndpointConceptDescriptionIdsSql = this.db.prepare(
            'DELETE FROM submodelConceptDescriptions WHERE endpoint = ?',
        );

        this.logger.info(`AAS index connected to ${this.variable.AAS_INDEX} (SQLite).`);
    }

    public getDocumentCount(endpoint?: string): Promise<number> {
        return new Promise((resolve, reject) => {
            try {
                const value = endpoint ? this.getCountEndpoint.get(endpoint) : this.getCountAll.get();
                if (value === undefined) {
                    resolve(0);
                    return;
                }

                resolve(Number(value['COUNT(*)']));
            } catch (error) {
                reject(error);
            }
        });
    }

    public getEndpoints(): Promise<AASEndpoint[]> {
        return new Promise((resolve, reject) => {
            try {
                const values = this.getEndpointsSql.all();
                resolve(values.map(value => this.toEndpoint(value)));
            } catch (error) {
                reject(error);
            }
        });
    }

    public getEndpointCount(): Promise<number> {
        return new Promise((resolve, reject) => {
            try {
                const value = this.getEndpointCountSql.get();
                if (value) {
                    resolve(Number(value['COUNT(*)']));
                } else {
                    resolve(0);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public getEndpoint(name: string): Promise<AASEndpoint> {
        return new Promise((resolve, reject) => {
            try {
                const value = this.getEndpointSql.get(name);
                if (value) {
                    resolve(this.toEndpoint(value));
                } else {
                    reject(new ApplicationError(ERRORS.ENDPOINT_DOES_NOT_EXIST, { endpoint: name }));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public findEndpoint(name: string): Promise<AASEndpoint | undefined> {
        return new Promise((resolve, reject) => {
            try {
                const value = this.getEndpointSql.get(name);
                if (value) {
                    resolve(this.toEndpoint(value));
                } else {
                    resolve(undefined);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public insertEndpoint(endpoint: AASEndpoint): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                this.insertEndpointSql.run(
                    endpoint.name,
                    endpoint.url,
                    endpoint.type,
                    endpoint.version ?? null,
                    endpoint.headers ? JSON.stringify(endpoint.headers) : null,
                    endpoint.schedule ? JSON.stringify(endpoint.schedule) : null,
                );

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    public updateEndpoint(endpoint: AASEndpoint): Promise<AASEndpoint> {
        return new Promise((resolve, reject) => {
            try {
                this.db.exec('BEGIN');
                const value = this.getEndpointSql.get(endpoint.name);
                if (value === undefined) {
                    reject(new ApplicationError(ERRORS.ENDPOINT_DOES_NOT_EXIST, { endpoint: endpoint.name }));
                    return;
                }

                this.updateEndpointSql.run(
                    endpoint.url,
                    endpoint.type,
                    endpoint.version ?? null,
                    endpoint.headers ? JSON.stringify(endpoint.headers) : null,
                    endpoint.schedule ? JSON.stringify(endpoint.schedule) : null,
                    endpoint.name,
                );

                this.db.exec('COMMIT');
                resolve(this.toEndpoint(value));
            } catch (error) {
                this.db.exec('ROLLBACK');
                reject(error);
            }
        });
    }

    public deleteEndpoint(endpoint: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                this.db.exec('BEGIN');
                this.deleteEndpointSql.run(endpoint);
                this.db.exec('COMMIT');
                resolve(true);
            } catch (error) {
                this.db.exec('ROLLBACK');
                reject(error);
            }
        });
    }

    public getDocuments(
        cursor: AASCursor,
        endpoints: string[] = [],
        expression?: string,
        language?: string,
    ): Promise<AASPagedResult> {
        return new Promise((resolve, reject) => {
            try {
                let result: AASPagedResult;
                if (cursor.next) {
                    result = this.getNextPage(cursor.next, cursor.limit, endpoints, expression, language);
                } else if (cursor.previous) {
                    result = this.getPreviousPage(cursor.previous, cursor.limit, endpoints, expression, language);
                } else if (cursor.previous === null) {
                    result = this.getFirstPage(cursor.limit, endpoints, expression, language);
                } else {
                    result = this.getLastPage(cursor.limit, endpoints, expression, language);
                }

                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    public getEndpointDocuments(
        endpoint: string,
        cursor: string | undefined,
        limit: number = LIMIT,
    ): Promise<PagedResult<AASDocument>> {
        return new Promise((resolve, reject) => {
            try {
                let sql: StatementSync;
                const params: SQLInputValue[] = [endpoint];
                if (cursor) {
                    params.push(cursor);
                    sql = this.db.prepare('SELECT * FROM documents WHERE endpoint = ? AND id >= ? ORDER BY id LIMIT ?');
                } else {
                    sql = this.db.prepare('SELECT * FROM documents WHERE endpoint = ? ORDER BY id LIMIT ?');
                }

                params.push(limit + 1);
                const values = sql.all(...params);
                const documents = values.map(value => this.toDocument(value));
                resolve({
                    result: documents.slice(0, limit),
                    paging_metadata: {
                        cursor: documents.length >= limit + 1 ? documents[limit].id : undefined,
                    },
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    public update(document: AASDocument): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                this.db.exec('BEGIN');
                const value = this.selectDocumentSql.get(document.endpoint, document.id);
                if (!value) {
                    this.db.exec('COMMIT');
                    resolve();
                    return;
                }

                const uuid = String(value.uuid);
                this.updateDocumentSql.run(
                    document.address,
                    document.idShort,
                    document.assetId ?? null,
                    document.timestamp,
                    document.thumbnail ?? null,
                    uuid,
                );

                if (document.content && document.content.submodels) {
                    this.deleteElementsSql.run(uuid);
                    this.traverseEnvironment(uuid, document.content);
                }

                this.db.exec('COMMIT');
                resolve();
            } catch (error) {
                this.db.exec('ROLLBACK');
                reject(error);
            }
        });
    }

    public insert(document: AASDocument): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                this.db.exec('BEGIN');
                const uuid = nanoid();
                this.insertDocumentSql.run(
                    uuid,
                    document.address,
                    document.endpoint,
                    document.id,
                    document.idShort,
                    document.assetId ?? null,
                    document.thumbnail ?? null,
                    document.timestamp,
                );

                if (document.content) {
                    this.traverseEnvironment(uuid, document.content);
                }

                this.db.exec('COMMIT');
                resolve();
            } catch (error) {
                this.db.exec('ROLLBACK');
                reject(error);
            }
        });
    }

    public find(
        endpoint: string | undefined,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Promise<AASDocument | undefined> {
        return new Promise((resolve, reject) => {
            try {
                const document = endpoint
                    ? this.selectEndpointDocument(endpoint, modelType, id)
                    : this.selectDocument(modelType, id);

                if (!document) {
                    resolve(undefined);
                } else {
                    resolve(this.toDocument(document));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public async get(
        endpoint: string | undefined,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Promise<AASDocument> {
        const document = await this.find(endpoint, modelType, id);
        if (!document) {
            throw new ApplicationError(ERRORS.AAS_NOT_FOUND, { modelType, id }, 404);
        }

        return document;
    }

    public delete(endpoint: string, id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                this.db.exec('BEGIN');
                const uuid = this.getUuid(endpoint, id);
                if (!uuid) {
                    this.db.exec('COMMIT');
                    resolve(false);
                    return;
                }

                this.deleteDocumentSql.run(uuid);
                this.db.exec('COMMIT');
                resolve(true);
            } catch (error) {
                this.db.exec('ROLLBACK');
                reject(error);
            }
        });
    }

    public create(endpoint: string, id: string, env: aas.Environment): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                this.db.exec('BEGIN');
                const uuid = this.getUuid(endpoint, id);
                if (uuid) {
                    this.traverseEnvironment(uuid, env);
                }

                this.db.exec('COMMIT');
                resolve();
            } catch (error) {
                this.db.exec('ROLLBACK');
                reject(error);
            }
        });
    }

    public clear(endpoint?: string, id?: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                this.db.exec('BEGIN');
                if (endpoint === undefined) {
                    this.deleteAllDocumentsSql.run();
                    this.deleteConceptDescriptionIdsSql.run();
                } else if (id) {
                    const uuid = this.getUuid(endpoint, id);
                    if (uuid) {
                        this.deleteElementsSql.run(uuid);
                    }
                } else {
                    this.deleteDocuments(endpoint);
                }

                this.db.exec('COMMIT');
                resolve();
            } catch (error) {
                this.db.exec('ROLLBACK');
                reject(error);
            }
        });
    }

    public getSubmodelConceptDescriptionIds(endpoint: string, id: string): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            try {
                const value = this.getConceptDescriptionIdsSql.get(endpoint, id);
                if (!value || !value.conceptDescriptionIds) {
                    return resolve([]);
                }

                resolve(JSON.parse(String(value.conceptDescriptionIds)) as string[]);
            } catch (error) {
                reject(error);
            }
        });
    }

    public setSubmodelConceptDescriptionIds(
        endpoint: string,
        id: string,
        conceptDescriptionIds: string[],
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const value = this.getConceptDescriptionIdsSql.get(endpoint, id);
                if (value) {
                    this.updateConceptDescriptionIdsSql.run(JSON.stringify(conceptDescriptionIds), endpoint, id);
                } else {
                    this.insertConceptDescriptionIdsSql.run(endpoint, id, JSON.stringify(conceptDescriptionIds));
                }

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    private deleteDocuments(endpoint: string): void {
        const values = this.selectEndpointDocumentsSql.all(endpoint);
        this.deleteEndpointDocumentsSql.run(endpoint);
        this.deleteEndpointConceptDescriptionIdsSql.run(endpoint);
        for (const value of values) {
            this.deleteElementsSql.run(String(value.uuid));
        }
    }

    public dispose(): void {
        if (this.db.isOpen) {
            this.db.close();
        }
    }

    private getUuid(endpoint: string, id: string): string | undefined {
        const value = this.selectUuidSql.get(endpoint, id);
        if (!value) {
            return undefined;
        }

        return String(value.uuid);
    }

    private getFirstPage(limit: number, endpoints: string[], expression?: string, language?: string): AASPagedResult {
        let sql: StatementSync;
        const values: SQLInputValue[] = [];
        if (expression) {
            if (endpoints.length > 0) {
                sql = this.db.prepare(
                    `SELECT d.* FROM documents AS d
                    WHERE d.endpoint IN ('${endpoints.join("','")}') 
                        AND (${this.createWhereClause(expression, values, language)}) 
                    ORDER BY d.endpoint, d.id LIMIT ?`,
                );
            } else {
                sql = this.db.prepare(
                    `SELECT d.* FROM documents AS d 
                    WHERE ${this.createWhereClause(expression, values, language)} 
                    ORDER BY d.endpoint, d.id LIMIT ?`,
                );
            }
        } else {
            if (endpoints.length > 0) {
                sql = this.db.prepare(
                    `SELECT * FROM documents 
                    WHERE endpoint IN ('${endpoints.join("','")}') 
                    ORDER BY endpoint, id LIMIT ?`,
                );
            } else {
                sql = this.db.prepare('SELECT * FROM documents ORDER BY endpoint, id LIMIT ?');
            }
        }

        values.push(limit + 1);
        const results = sql.all(...values);
        const documents = results.map(result => this.toDocument(result));

        return {
            previous: null,
            documents: documents.slice(0, limit),
            next: documents.length >= limit + 1 ? toDocumentId(documents[limit]) : null,
        };
    }

    private getNextPage(
        current: AASDocumentId,
        limit: number,
        endpoints: string[],
        expression?: string,
        language?: string,
    ): AASPagedResult {
        let sql: StatementSync;
        const values: SQLInputValue[] = [current.endpoint, current.endpoint, current.id];

        if (expression) {
            if (endpoints.length > 0) {
                sql = this.db.prepare(
                    `SELECT d.* FROM documents AS d 
                    WHERE d.endpoint IN ('${endpoints.join('","')}') 
                        AND (d.endpoint > ? OR (d.endpoint = ? AND d.id >= ?)) 
                        AND (${this.createWhereClause(expression, values, language)}) 
                    ORDER BY d.endpoint, d.id LIMIT ?`,
                );
            } else {
                sql = this.db.prepare(
                    `SELECT d.* FROM documents AS d 
                    WHERE (d.endpoint > ? OR (d.endpoint = ? AND d.id >= ?)) 
                        AND (${this.createWhereClause(expression, values, language)}) 
                    ORDER BY d.endpoint, d.id LIMIT ?`,
                );
            }
        } else {
            if (endpoints.length > 0) {
                sql = this.db.prepare(
                    `SELECT * FROM documents 
                    WHERE endpoint IN ('${endpoints.join("','")}') 
                        AND (endpoint > ? OR (endpoint = ? AND id >= ?)) 
                    ORDER BY endpoint, id LIMIT ?`,
                );
            } else {
                sql = this.db.prepare(
                    `SELECT * FROM documents 
                    WHERE (endpoint > ? OR (endpoint = ? AND id >= ?)) 
                    ORDER BY endpoint, id LIMIT ?`,
                );
            }
        }

        values.push(limit + 1);
        const results = sql.all(...values);
        const documents = results.map(result => this.toDocument(result));

        return {
            previous: current,
            documents: documents.slice(0, limit),
            next: documents.length >= limit + 1 ? toDocumentId(documents[limit]) : null,
        };
    }

    private getPreviousPage(
        current: AASDocumentId,
        limit: number,
        endpoints: string[],
        expression?: string,
        language?: string,
    ): AASPagedResult {
        let sql: StatementSync;
        const values: SQLInputValue[] = [current.endpoint, current.endpoint, current.id];

        if (expression) {
            if (endpoints.length > 0) {
                sql = this.db.prepare(
                    `SELECT d.* FROM documents AS d 
                    WHERE d.endpoint IN ('${endpoints.join("','")}') 
                        AND (d.endpoint < ? OR (d.endpoint = ? AND d.id < ?)) 
                        AND (${this.createWhereClause(expression, values, language)}) 
                    ORDER BY d.endpoint DESC, d.id DESC LIMIT ?`,
                );
            } else {
                sql = this.db.prepare(
                    `SELECT d.* FROM documents AS d
                    WHERE (d.endpoint < ? OR (d.endpoint = ? AND d.id < ?))
                        AND (${this.createWhereClause(expression, values, language)}) 
                    ORDER BY d.endpoint DESC, d.id DESC LIMIT ?`,
                );
            }
        } else {
            if (endpoints.length > 0) {
                sql = this.db.prepare(
                    `SELECT * FROM documents 
                    WHERE endpoint IN ('${endpoints.join("','")}') 
                        AND (endpoint < ? OR (endpoint = ? AND id < ?)) 
                    ORDER BY endpoint DESC, id DESC LIMIT ?`,
                );
            } else {
                sql = this.db.prepare(
                    `SELECT * FROM documents 
                    WHERE (endpoint < ? OR (endpoint = ? AND id < ?)) 
                    ORDER BY endpoint DESC, id DESC LIMIT ?`,
                );
            }
        }

        values.push(limit + 1);
        const results = sql.all(...values);
        const documents = results.map(result => this.toDocument(result));

        return {
            previous: documents.length >= limit + 1 ? toDocumentId(documents[limit - 1]) : null,
            documents: documents.slice(0, limit).reverse(),
            next: current,
        };
    }

    private getLastPage(limit: number, endpoints: string[], expression?: string, language?: string): AASPagedResult {
        let sql: StatementSync;
        const values: SQLInputValue[] = [];
        if (expression) {
            if (endpoints.length > 0) {
                sql = this.db.prepare(
                    `SELECT documents.* FROM documents AS d
                    WHERE d.endpoint IN ('${endpoints.join("','")}') 
                        AND (${this.createWhereClause(expression, values, language)}) 
                    ORDER BY d.endpoint DESC, d.id DESC LIMIT ?`,
                );
            } else {
                sql = this.db.prepare(
                    `SELECT documents.* FROM documents AS d
                    WHERE ${this.createWhereClause(expression, values, language)} 
                    ORDER BY d.endpoint DESC, d.id DESC LIMIT ?`,
                );
            }
        } else {
            if (endpoints.length > 0) {
                sql = this.db.prepare(
                    `SELECT * FROM documents 
                    WHERE endpoint IN ('${endpoints.join("','")}') 
                    ORDER BY endpoint DESC, id DESC LIMIT ?`,
                );
            } else {
                sql = this.db.prepare('SELECT * FROM documents ORDER BY endpoint DESC, id DESC LIMIT ?');
            }
        }

        values.push(limit + 1);
        const results = sql.all(...values);
        const documents = results.map(result => this.toDocument(result));

        return {
            previous: documents.length >= limit + 1 ? toDocumentId(documents[limit - 1]) : null,
            documents: documents.slice(0, limit).reverse(),
            next: null,
        };
    }

    private createWhereClause(expression: string, values: SQLInputValue[], language?: string): string {
        const parser = new FilterExpressionParser(expression, language);
        if (parser.expressionType === 'model-type') {
            return getWhereClause(parser.clause, values);
        }

        const query = parser.clause
            .flatMap(item => item.andConditions)
            .map(word => '"' + String(word).normalize('NFKC').toLocaleLowerCase(language) + '"')
            .join(' ');

        values.push(query);
        values.push(query);

        return `
        (EXISTS (SELECT 1 FROM documents_fts df
            WHERE df.rowid = d.rowid AND documents_fts MATCH ?)
        OR EXISTS (SELECT 1 FROM elements e
            JOIN elements_fts ef ON ef.rowid = e.rowid WHERE e.uuid = d.uuid AND elements_fts MATCH ?))`;
    }

    private traverseEnvironment(documentId: string, env: aas.Environment): void {
        if (env.submodels === undefined) {
            return;
        }

        for (const submodel of env.submodels) {
            for (const referable of flat(submodel)) {
                if (referable.idShort) {
                    this.writeElement(documentId, referable);
                }
            }
        }
    }

    private writeElement(uuid: string, referable: aas.Referable): void {
        this.insertElementSql.run(
            uuid,
            toAbbreviation(referable),
            isIdentifiable(referable) ? referable.id : null,
            referable.idShort,
            this.toStringValue(referable),
            this.toNumberValue(referable),
            this.toDateValue(referable),
            this.toBooleanValue(referable),
            this.toBigIntValue(referable),
        );
    }

    private selectEndpointDocument(
        endpoint: string,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Record<string, SQLOutputValue> | undefined {
        return modelType === 'AssetAdministrationShell'
            ? this.getEndpointDocumentAASSql.get(endpoint, id)
            : this.getEndpointDocumentAssetSql.get(endpoint, id);
    }

    private selectDocument(
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Record<string, SQLOutputValue> | undefined {
        return modelType === 'AssetAdministrationShell'
            ? this.getDocumentAASSql.get(id)
            : this.getDocumentAssetSql.get(id);
    }

    private toStringValue(referable: aas.Referable): string | null {
        if (isProperty(referable)) {
            return referable.value ?? null;
        }

        if (isMultiLanguageProperty(referable)) {
            if (!Array.isArray(referable.value) || referable.value.length === 0) {
                return null;
            }

            return Array.from(new Set(referable.value.map(item => item.text))).join(' ');
        }

        if (isFile(referable)) {
            return referable.value ?? referable.contentType ?? null;
        }

        if (isBlob(referable)) {
            return referable.contentType ?? null;
        }

        return null;
    }

    private toNumberValue(referable: aas.Referable): number | null {
        if (!isProperty(referable) || !referable.value || baseType(referable.valueType) !== 'number') {
            return null;
        }

        const value = parseNumber(referable.value);
        if (Number.isNaN(value)) {
            return null;
        }

        return value;
    }

    private toDateValue(referable: aas.Referable): string | null {
        if (!isProperty(referable) || !referable.value || baseType(referable.valueType) !== 'Date') {
            return null;
        }

        const value = parseDate(referable.value);
        return isValidDate(value) ? value.toUTCString() : null;
    }

    private toBooleanValue(referable: aas.Referable): number | null {
        if (!isProperty(referable) || !referable.value || baseType(referable.valueType) !== 'boolean') {
            return null;
        }

        return toBoolean(referable.value) ? 1 : 0;
    }

    private toBigIntValue(referable: aas.Referable): string | null {
        if (!isProperty(referable) || !referable.value || baseType(referable.valueType) !== 'bigint') {
            return null;
        }

        try {
            return BigInt(referable.value).toString();
        } catch {
            return null;
        }
    }

    private toEndpoint(value: Record<string, SQLOutputValue>): AASEndpoint {
        const endpoint: AASEndpoint = {
            name: String(value.name),
            url: String(value.url),
            type: String(value.type) as AASEndpointType,
        };

        if (value.version) {
            endpoint.version = String(value.version);
        }

        if (value.headers) {
            endpoint.headers = JSON.parse(String(value.headers));
        }

        if (value.schedule) {
            endpoint.schedule = JSON.parse(String(value.schedule));
        }

        return endpoint;
    }

    private toDocument(value: Record<string, SQLOutputValue>): AASDocument {
        const document: AASDocument = {
            address: String(value.address),
            endpoint: String(value.endpoint),
            id: String(value.id),
            idShort: String(value.idShort),
            timestamp: Number(value.timestamp),
            content: null,
        };

        if (value.assetId) {
            document.assetId = String(value.assetId);
        }

        if (value.thumbnail !== '') {
            document.thumbnail = value.thumbnail === null ? null : String(value.thumbnail);
        }

        return document;
    }
}
