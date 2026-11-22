/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { tmpdir } from 'os';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { LOGGER, SqliteClient, type SqlParam } from 'aas-package';
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

CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(idShort, id, assetId, tokenize = 'unicode61');
CREATE VIRTUAL TABLE IF NOT EXISTS elements_fts USING fts5(id, idShort, stringValue, tokenize = 'unicode61');

CREATE TRIGGER IF NOT EXISTS documents_fts_ai AFTER INSERT ON documents BEGIN
    INSERT INTO documents_fts(rowid, idShort, id, assetId)
    VALUES (new.rowid, new.idShort, new.id, new.assetId);
END;

CREATE TRIGGER IF NOT EXISTS documents_fts_ad AFTER DELETE ON documents BEGIN
    DELETE FROM documents_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS documents_fts_au AFTER UPDATE ON documents BEGIN
    DELETE FROM documents_fts WHERE rowid = old.rowid;
    INSERT INTO documents_fts(rowid, idShort, id, assetId)
    VALUES (new.rowid, new.idShort, new.id, new.assetId);
END;

CREATE TRIGGER IF NOT EXISTS elements_fts_ai AFTER INSERT ON elements BEGIN
    INSERT INTO elements_fts(rowid, id, idShort, stringValue)
    VALUES (new.rowid, new.id, new.idShort, new.stringValue);
END;

CREATE TRIGGER IF NOT EXISTS elements_fts_ad AFTER DELETE ON elements BEGIN
    DELETE FROM elements_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS elements_fts_au AFTER UPDATE ON elements BEGIN
    DELETE FROM elements_fts WHERE rowid = old.rowid;
    INSERT INTO elements_fts(rowid, id, idShort, stringValue)
    VALUES (new.rowid, new.id, new.idShort, new.stringValue);
END;
`;

@singleton()
export class SqliteIndex implements AASIndex {
    private readonly logger = container.resolve(LOGGER);
    private readonly variable = container.resolve(Variable);
    private readonly connectionProvider = container.resolve(SqliteConnectionProvider);
    private readonly endpoint =
        process.platform === 'win32' ? `\\\\.\\pipe\\aas-index` : join(tmpdir(), `aas-index.sock`);

    private readonly db: Promise<SqliteClient>;
    private readonly getCountAll = 'SELECT COUNT(*) FROM documents';
    private readonly getCountEndpoint = 'SELECT COUNT(*) FROM documents WHERE endpoint = ?';
    private readonly getEndpointsSql = 'SELECT * FROM endpoints';
    private readonly getEndpointCountSql = 'SELECT COUNT(*) FROM endpoints AS count';
    private readonly insertEndpointSql =
        'INSERT INTO endpoints (name, url, type, version, headers, schedule) VALUES (?, ?, ?, ?, ?, ?)';
    private readonly getEndpointSql = 'SELECT * FROM endpoints WHERE name = ?';
    private readonly updateEndpointSql =
        'UPDATE endpoints SET url = ?, type = ?, version = ?, headers = ?, schedule = ? WHERE name = ?';
    private readonly deleteEndpointSql = 'DELETE FROM endpoints WHERE name = ?';
    private readonly getDocumentAASSql = 'SELECT * FROM documents WHERE id = ?';
    private readonly getDocumentAssetSql = 'SELECT * FROM documents WHERE assetId = ?';
    private readonly getEndpointDocumentAASSql = 'SELECT * FROM documents WHERE endpoint = ? AND id = ?';
    private readonly getEndpointDocumentAssetSql = 'SELECT * FROM documents WHERE endpoint = ? AND assetId = ?';
    private readonly selectDocumentSql = 'SELECT uuid FROM documents WHERE endpoint = ? AND id = ?';
    private readonly insertDocumentSql =
        'INSERT INTO documents (uuid, address, endpoint, id, idShort, assetId, thumbnail, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    private readonly deleteDocumentSql = 'DELETE FROM documents WHERE uuid = ?';
    private readonly updateDocumentSql =
        'UPDATE documents SET address = ?, idShort = ?, assetId = ?, timestamp = ?, thumbnail = ? WHERE uuid = ?';
    private readonly deleteElementsSql = 'DELETE FROM elements WHERE uuid = ?';
    private readonly insertElementSql =
        'INSERT INTO elements (uuid, modelType, id, idShort, stringValue, numberValue, dateValue, booleanValue, bigintValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    private readonly selectUuidSql = 'SELECT uuid FROM documents WHERE endpoint = ? AND id = ?';
    private readonly selectEndpointDocumentsSql = 'SELECT uuid FROM documents WHERE endpoint = ?';
    private readonly deleteEndpointDocumentsSql = 'DELETE FROM documents WHERE endpoint = ?';
    private readonly deleteAllDocumentsSql = 'DELETE FROM documents';
    private readonly getConceptDescriptionIdsSql =
        'SELECT conceptDescriptionIds FROM submodelConceptDescriptions WHERE endpoint = ? AND id = ?';
    private readonly insertConceptDescriptionIdsSql =
        'INSERT INTO submodelConceptDescriptions (endpoint, id, conceptDescriptionIds) VALUES (?, ?, ?)';
    private readonly updateConceptDescriptionIdsSql =
        'UPDATE submodelConceptDescriptions SET conceptDescriptionIds = ? WHERE endpoint = ? AND id = ?';
    private readonly deleteConceptDescriptionIdsSql = 'DELETE FROM submodelConceptDescriptions';
    private readonly deleteEndpointConceptDescriptionIdsSql =
        'DELETE FROM submodelConceptDescriptions WHERE endpoint = ?';

    public constructor() {
        this.db = this.connectionProvider.getClient(this.variable.AAS_INDEX, this.endpoint).then(async db => {
            await db.exec(initDatabase);
            return db;
        });

        this.logger.info(`AAS index connected to ${this.variable.AAS_INDEX} (SQLite).`);
    }

    public async getDocumentCount(endpoint?: string): Promise<number> {
        const db = await this.db;
        const value = endpoint
            ? await db.get<{ 'COUNT(*)': number | string }>(this.getCountEndpoint, [endpoint])
            : await db.get<{ 'COUNT(*)': number | string }>(this.getCountAll);
        return value ? Number(value['COUNT(*)']) : 0;
    }

    public async getEndpoints(): Promise<AASEndpoint[]> {
        const db = await this.db;
        const values = await db.all(this.getEndpointsSql);
        return values.map(value => this.toEndpoint(value));
    }

    public async getEndpointCount(): Promise<number> {
        const db = await this.db;
        const value = await db.get<{ 'COUNT(*)': number | string }>(this.getEndpointCountSql);
        return value ? Number(value['COUNT(*)']) : 0;
    }

    public async getEndpoint(name: string): Promise<AASEndpoint> {
        const db = await this.db;
        const value = await db.get(this.getEndpointSql, [name]);
        if (!value) {
            throw new ApplicationError(ERRORS.ENDPOINT_DOES_NOT_EXIST, { endpoint: name });
        }

        return this.toEndpoint(value);
    }

    public async findEndpoint(name: string): Promise<AASEndpoint | undefined> {
        const db = await this.db;
        const value = await db.get(this.getEndpointSql, [name]);
        return value ? this.toEndpoint(value) : undefined;
    }

    public async insertEndpoint(endpoint: AASEndpoint): Promise<void> {
        const db = await this.db;
        await db.run(this.insertEndpointSql, [
            endpoint.name,
            endpoint.url,
            endpoint.type,
            endpoint.version ?? null,
            endpoint.headers ? JSON.stringify(endpoint.headers) : null,
            endpoint.schedule ? JSON.stringify(endpoint.schedule) : null,
        ]);
    }

    public async updateEndpoint(endpoint: AASEndpoint): Promise<AASEndpoint> {
        const db = await this.db;
        return db.transaction(async client => {
            const value = await client.get(this.getEndpointSql, [endpoint.name]);
            if (!value) {
                throw new ApplicationError(ERRORS.ENDPOINT_DOES_NOT_EXIST, { endpoint: endpoint.name });
            }

            await client.run(this.updateEndpointSql, [
                endpoint.url,
                endpoint.type,
                endpoint.version ?? null,
                endpoint.headers ? JSON.stringify(endpoint.headers) : null,
                endpoint.schedule ? JSON.stringify(endpoint.schedule) : null,
                endpoint.name,
            ]);

            return this.toEndpoint(value);
        });
    }

    public async deleteEndpoint(endpoint: string): Promise<boolean> {
        const db = await this.db;
        await db.transaction(async client => {
            await client.run(this.deleteEndpointSql, [endpoint]);
        });
        return true;
    }

    public async getDocuments(
        cursor: AASCursor,
        endpoints: string[] = [],
        expression?: string,
        language?: string,
    ): Promise<AASPagedResult> {
        if (cursor.next) {
            return this.getNextPage(cursor.next, cursor.limit, endpoints, expression, language);
        } else if (cursor.previous) {
            return this.getPreviousPage(cursor.previous, cursor.limit, endpoints, expression, language);
        } else if (cursor.previous === null) {
            return this.getFirstPage(cursor.limit, endpoints, expression, language);
        }

        return this.getLastPage(cursor.limit, endpoints, expression, language);
    }

    public async getEndpointDocuments(
        endpoint: string,
        cursor: string | undefined,
        limit: number = LIMIT,
    ): Promise<PagedResult<AASDocument>> {
        const sql = cursor
            ? 'SELECT * FROM documents WHERE endpoint = ? AND id >= ? ORDER BY id LIMIT ?'
            : 'SELECT * FROM documents WHERE endpoint = ? ORDER BY id LIMIT ?';
        const params: SqlParam[] = cursor ? [endpoint, cursor, limit + 1] : [endpoint, limit + 1];
        const db = await this.db;
        const values = await db.all(sql, params);
        const documents = values.map(value => this.toDocument(value));
        return {
            result: documents.slice(0, limit),
            paging_metadata: {
                cursor: documents.length >= limit + 1 ? documents[limit].id : undefined,
            },
        };
    }

    public async update(document: AASDocument): Promise<void> {
        const db = await this.db;
        await db.transaction(async client => {
            const value = await client.get(this.selectDocumentSql, [document.endpoint, document.id]);
            if (!value) {
                return;
            }

            const uuid = String(value.uuid);
            await client.run(this.updateDocumentSql, [
                document.address,
                document.idShort,
                document.assetId ?? null,
                document.timestamp,
                document.thumbnail ?? null,
                uuid,
            ]);

            if (document.content?.submodels) {
                await client.run(this.deleteElementsSql, [uuid]);
                await this.traverseEnvironment(client, uuid, document.content);
            }
        });
    }

    public async insert(document: AASDocument): Promise<void> {
        const db = await this.db;
        await db.transaction(async client => {
            const uuid = nanoid();
            await client.run(this.insertDocumentSql, [
                uuid,
                document.address,
                document.endpoint,
                document.id,
                document.idShort,
                document.assetId ?? null,
                document.thumbnail ?? null,
                document.timestamp,
            ]);

            if (document.content) {
                await this.traverseEnvironment(client, uuid, document.content);
            }
        });
    }

    public async find(
        endpoint: string | undefined,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Promise<AASDocument | undefined> {
        const db = await this.db;
        const document = endpoint
            ? await this.selectEndpointDocument(db, endpoint, modelType, id)
            : await this.selectDocument(db, modelType, id);
        return document ? this.toDocument(document) : undefined;
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

    public async delete(endpoint: string, id: string): Promise<boolean> {
        const db = await this.db;
        return db.transaction(async client => {
            const uuid = await this.getUuid(client, endpoint, id);
            if (!uuid) {
                return false;
            }

            await client.run(this.deleteDocumentSql, [uuid]);
            return true;
        });
    }

    public async create(endpoint: string, id: string, env: aas.Environment): Promise<void> {
        const db = await this.db;
        await db.transaction(async client => {
            const uuid = await this.getUuid(client, endpoint, id);
            if (uuid) {
                await this.traverseEnvironment(client, uuid, env);
            }
        });
    }

    public async clear(endpoint?: string, id?: string): Promise<void> {
        const db = await this.db;
        await db.transaction(async client => {
            if (endpoint === undefined) {
                await client.run(this.deleteAllDocumentsSql);
                await client.run(this.deleteConceptDescriptionIdsSql);
            } else if (id) {
                const uuid = await this.getUuid(client, endpoint, id);
                if (uuid) {
                    await client.run(this.deleteElementsSql, [uuid]);
                }
            } else {
                await this.deleteDocuments(client, endpoint);
            }
        });
    }

    public async getSubmodelConceptDescriptionIds(endpoint: string, id: string): Promise<string[]> {
        const db = await this.db;
        const value = await db.get(this.getConceptDescriptionIdsSql, [endpoint, id]);
        if (!value || !value.conceptDescriptionIds) {
            return [];
        }

        return JSON.parse(String(value.conceptDescriptionIds)) as string[];
    }

    public async setSubmodelConceptDescriptionIds(
        endpoint: string,
        id: string,
        conceptDescriptionIds: string[],
    ): Promise<void> {
        const db = await this.db;
        await db.transaction(async client => {
            const value = await client.get(this.getConceptDescriptionIdsSql, [endpoint, id]);
            if (value) {
                await client.run(this.updateConceptDescriptionIdsSql, [
                    JSON.stringify(conceptDescriptionIds),
                    endpoint,
                    id,
                ]);
            } else {
                await client.run(this.insertConceptDescriptionIdsSql, [
                    endpoint,
                    id,
                    JSON.stringify(conceptDescriptionIds),
                ]);
            }
        });
    }

    private async deleteDocuments(client: SqliteClient, endpoint: string): Promise<void> {
        const values = await client.all(this.selectEndpointDocumentsSql, [endpoint]);
        await client.run(this.deleteEndpointDocumentsSql, [endpoint]);
        await client.run(this.deleteEndpointConceptDescriptionIdsSql, [endpoint]);
        for (const value of values) {
            await client.run(this.deleteElementsSql, [String(value.uuid)]);
        }
    }

    public async dispose(): Promise<void> {
        (await this.db).close();
    }

    private async getUuid(client: SqliteClient, endpoint: string, id: string): Promise<string | undefined> {
        const value = await client.get(this.selectUuidSql, [endpoint, id]);
        if (!value) {
            return undefined;
        }

        return String(value.uuid);
    }

    private async getFirstPage(
        limit: number,
        endpoints: string[],
        expression?: string,
        language?: string,
    ): Promise<AASPagedResult> {
        let sql: string;
        const values: SqlParam[] = [];
        if (expression) {
            if (endpoints.length > 0) {
                sql = `SELECT d.* FROM documents AS d WHERE d.endpoint IN ('${endpoints.join(
                    "','",
                )}') AND (${this.createWhereClause(expression, values, language)}) ORDER BY d.endpoint, d.id LIMIT ?`;
            } else {
                sql = `SELECT d.* FROM documents AS d WHERE ${this.createWhereClause(
                    expression,
                    values,
                    language,
                )} ORDER BY d.endpoint, d.id LIMIT ?`;
            }
        } else {
            if (endpoints.length > 0) {
                sql = `SELECT * FROM documents WHERE endpoint IN ('${endpoints.join(
                    "','",
                )}') ORDER BY endpoint, id LIMIT ?`;
            } else {
                sql = 'SELECT * FROM documents ORDER BY endpoint, id LIMIT ?';
            }
        }

        values.push(limit + 1);
        const db = await this.db;
        const results = await db.all(sql, values);
        const documents = results.map(result => this.toDocument(result));

        return {
            previous: null,
            documents: documents.slice(0, limit),
            next: documents.length >= limit + 1 ? toDocumentId(documents[limit]) : null,
        };
    }

    private async getNextPage(
        current: AASDocumentId,
        limit: number,
        endpoints: string[],
        expression?: string,
        language?: string,
    ): Promise<AASPagedResult> {
        let sql: string;
        const values: SqlParam[] = [current.endpoint, current.endpoint, current.id];

        if (expression) {
            if (endpoints.length > 0) {
                sql = `SELECT d.* FROM documents AS d WHERE d.endpoint IN ('${endpoints.join(
                    '","',
                )}') AND (d.endpoint > ? OR (d.endpoint = ? AND d.id >= ?)) AND (${this.createWhereClause(
                    expression,
                    values,
                    language,
                )}) ORDER BY d.endpoint, d.id LIMIT ?`;
            } else {
                sql = `SELECT d.* FROM documents AS d WHERE (d.endpoint > ? OR (d.endpoint = ? AND d.id >= ?)) AND (${this.createWhereClause(
                    expression,
                    values,
                    language,
                )}) ORDER BY d.endpoint, d.id LIMIT ?`;
            }
        } else {
            if (endpoints.length > 0) {
                sql = `SELECT * FROM documents WHERE endpoint IN ('${endpoints.join(
                    "','",
                )}') AND (endpoint > ? OR (endpoint = ? AND id >= ?)) ORDER BY endpoint, id LIMIT ?`;
            } else {
                sql =
                    'SELECT * FROM documents WHERE (endpoint > ? OR (endpoint = ? AND id >= ?)) ORDER BY endpoint, id LIMIT ?';
            }
        }

        values.push(limit + 1);
        const db = await this.db;
        const results = await db.all(sql, values);
        const documents = results.map(result => this.toDocument(result));

        return {
            previous: current,
            documents: documents.slice(0, limit),
            next: documents.length >= limit + 1 ? toDocumentId(documents[limit]) : null,
        };
    }

    private async getPreviousPage(
        current: AASDocumentId,
        limit: number,
        endpoints: string[],
        expression?: string,
        language?: string,
    ): Promise<AASPagedResult> {
        let sql: string;
        const values: SqlParam[] = [current.endpoint, current.endpoint, current.id];

        if (expression) {
            if (endpoints.length > 0) {
                sql = `SELECT d.* FROM documents AS d WHERE d.endpoint IN ('${endpoints.join(
                    "','",
                )}') AND (d.endpoint < ? OR (d.endpoint = ? AND d.id < ?)) AND (${this.createWhereClause(
                    expression,
                    values,
                    language,
                )}) ORDER BY d.endpoint DESC, d.id DESC LIMIT ?`;
            } else {
                sql = `SELECT d.* FROM documents AS d WHERE (d.endpoint < ? OR (d.endpoint = ? AND d.id < ?)) AND (${this.createWhereClause(
                    expression,
                    values,
                    language,
                )}) ORDER BY d.endpoint DESC, d.id DESC LIMIT ?`;
            }
        } else {
            if (endpoints.length > 0) {
                sql = `SELECT * FROM documents WHERE endpoint IN ('${endpoints.join(
                    "','",
                )}') AND (endpoint < ? OR (endpoint = ? AND id < ?)) ORDER BY endpoint DESC, id DESC LIMIT ?`;
            } else {
                sql =
                    'SELECT * FROM documents WHERE (endpoint < ? OR (endpoint = ? AND id < ?)) ORDER BY endpoint DESC, id DESC LIMIT ?';
            }
        }

        values.push(limit + 1);
        const db = await this.db;
        const results = await db.all(sql, values);
        const documents = results.map(result => this.toDocument(result));

        return {
            previous: documents.length >= limit + 1 ? toDocumentId(documents[limit - 1]) : null,
            documents: documents.slice(0, limit).reverse(),
            next: current,
        };
    }

    private async getLastPage(
        limit: number,
        endpoints: string[],
        expression?: string,
        language?: string,
    ): Promise<AASPagedResult> {
        let sql: string;
        const values: SqlParam[] = [];
        if (expression) {
            if (endpoints.length > 0) {
                sql = `SELECT d.* FROM documents AS d WHERE d.endpoint IN ('${endpoints.join(
                    "','",
                )}') AND (${this.createWhereClause(
                    expression,
                    values,
                    language,
                )}) ORDER BY d.endpoint DESC, d.id DESC LIMIT ?`;
            } else {
                sql = `SELECT d.* FROM documents AS d WHERE ${this.createWhereClause(
                    expression,
                    values,
                    language,
                )} ORDER BY d.endpoint DESC, d.id DESC LIMIT ?`;
            }
        } else {
            if (endpoints.length > 0) {
                sql = `SELECT * FROM documents WHERE endpoint IN ('${endpoints.join(
                    "','",
                )}') ORDER BY endpoint DESC, id DESC LIMIT ?`;
            } else {
                sql = 'SELECT * FROM documents ORDER BY endpoint DESC, id DESC LIMIT ?';
            }
        }

        values.push(limit + 1);
        const db = await this.db;
        const results = await db.all(sql, values);
        const documents = results.map(result => this.toDocument(result));

        return {
            previous: documents.length >= limit + 1 ? toDocumentId(documents[limit - 1]) : null,
            documents: documents.slice(0, limit).reverse(),
            next: null,
        };
    }

    private createWhereClause(expression: string, values: SqlParam[], language?: string): string {
        const parser = new FilterExpressionParser(expression, language);
        if (parser.expressionType === 'model-type') {
            return getWhereClause(parser.clause, values);
        }

        const query = parser.clause
            .flatMap(item => item.andConditions)
            .map(word => {
                const s = String(word);
                return s.indexOf(' ') < 0 ? s : `"${s}"`;
            })
            .join(' OR ');

        values.push(query);
        values.push(query);

        return (
            '(EXISTS (SELECT 1 FROM documents_fts df ' +
            'WHERE df.rowid = d.rowid AND documents_fts MATCH ?) OR ' +
            'EXISTS (SELECT 1 FROM elements AS e JOIN elements_fts ef ON ef.rowid = e.rowid ' +
            'WHERE e.uuid = d.uuid AND elements_fts MATCH ?))'
        );
    }

    private async traverseEnvironment(client: SqliteClient, documentId: string, env: aas.Environment): Promise<void> {
        if (env.submodels === undefined) {
            return;
        }

        for (const submodel of env.submodels) {
            for (const referable of flat(submodel)) {
                if (referable.idShort) {
                    await this.writeElement(client, documentId, referable);
                }
            }
        }
    }

    private async writeElement(client: SqliteClient, uuid: string, referable: aas.Referable): Promise<void> {
        await client.run(this.insertElementSql, [
            uuid,
            toAbbreviation(referable),
            isIdentifiable(referable) ? referable.id : null,
            referable.idShort,
            this.toStringValue(referable),
            this.toNumberValue(referable),
            this.toDateValue(referable),
            this.toBooleanValue(referable),
            this.toBigIntValue(referable),
        ]);
    }

    private async selectEndpointDocument(
        client: SqliteClient,
        endpoint: string,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Promise<Record<string, unknown> | null> {
        return modelType === 'AssetAdministrationShell'
            ? client.get(this.getEndpointDocumentAASSql, [endpoint, id])
            : client.get(this.getEndpointDocumentAssetSql, [endpoint, id]);
    }

    private async selectDocument(
        client: SqliteClient,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Promise<Record<string, unknown> | null> {
        return modelType === 'AssetAdministrationShell'
            ? client.get(this.getDocumentAASSql, [id])
            : client.get(this.getDocumentAssetSql, [id]);
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

    private toEndpoint(value: Record<string, unknown>): AASEndpoint {
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

    private toDocument(value: Record<string, unknown>): AASDocument {
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
