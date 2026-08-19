/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DatabaseSync, SQLInputValue, SQLOutputValue, StatementSync } from 'node:sqlite';
import { nanoid } from 'nanoid';
import { Logger } from 'aas-package';
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
} from 'aas-core';

import { AASIndex } from '../aas-index.js';
import { KeywordDirectory } from '../keyword-directory.js';
import { ERRORS } from '../../errors.js';
import { SqliteQuery } from './sqlite-query.js';

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
    address TEXT, 
    endpoint TEXT, 
    id TEXT, 
    idShort TEXT, 
    assetId TEXT,
    thumbnail TEXT, 
    timestamp INTEGER,
    UNIQUE (id, endpoint)
);

CREATE TABLE IF NOT EXISTS elements (
    uuid TEXT NOT NULL,
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
    endpoint TEXT NOT NULL,
    id TEXT NOT NULL,
    conceptDescriptionIds TEXT NOT NULL,
    UNIQUE (id, endpoint)
);
`;

export class SqliteIndex extends AASIndex {
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
    private readonly deleteAllElementsSql: StatementSync;
    private readonly deleteAllDocumentsSql: StatementSync;
    private readonly getConceptDescriptionIdsSql: StatementSync;
    private readonly insertConceptDescriptionIdsSql: StatementSync;
    private readonly updateConceptDescriptionIdsSql: StatementSync;
    private readonly deleteConceptDescriptionIdsSql: StatementSync;
    private readonly deleteEndpointConceptDescriptionIdsSql: StatementSync;

    public constructor(
        private readonly logger: Logger,
        keywords: KeywordDirectory,
        file: string,
    ) {
        super(keywords);

        this.db = new DatabaseSync(file, { timeout: 5000 });
        this.db.exec(initDatabase);
        this.db.exec('PRAGMA journal_mode = WAL');

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
            'UPDATE documents SET address = ?, idShort = ?, timestamp = ?, thumbnail = ? WHERE uuid = ?',
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
        this.deleteAllElementsSql = this.db.prepare('DELETE FROM elements');
        this.deleteAllDocumentsSql = this.db.prepare('DELETE FROM documents');
        this.selectEndpointDocumentsSql = this.db.prepare('SELECT uuid FROM documents WHERE endpoint = ? LIMIT ?');
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

        this.logger.info(`AAS index connected to ${file} (SQLite).`);
    }

    public override getDocumentCount(endpoint?: string): Promise<number> {
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

    public override getEndpoints(): Promise<AASEndpoint[]> {
        return new Promise((resolve, reject) => {
            try {
                const values = this.getEndpointsSql.all();
                resolve(values.map(value => this.toEndpoint(value)));
            } catch (error) {
                reject(error);
            }
        });
    }

    public override getEndpointCount(): Promise<number> {
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

    public override getEndpoint(name: string): Promise<AASEndpoint> {
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

    public override findEndpoint(name: string): Promise<AASEndpoint | undefined> {
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

    public override insertEndpoint(endpoint: AASEndpoint): Promise<void> {
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

    public override updateEndpoint(endpoint: AASEndpoint): Promise<AASEndpoint> {
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

    public override deleteEndpoint(endpoint: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                this.db.exec('BEGIN');
                this.deleteDocuments(endpoint);
                this.deleteEndpointSql.run(endpoint);
                this.db.exec('COMMIT');
                resolve(true);
            } catch (error) {
                this.db.exec('ROLLBACK');
                reject(error);
            }
        });
    }

    public override getDocuments(cursor: AASCursor, expression?: string, language?: string): Promise<AASPagedResult> {
        return new Promise((resolve, reject) => {
            try {
                let query: SqliteQuery | undefined;
                if (expression) {
                    query = new SqliteQuery(expression, language ?? 'en');
                }

                let result: AASPagedResult;
                if (cursor.next) {
                    result = this.getNextPage(cursor.next, cursor.limit, query);
                } else if (cursor.previous) {
                    result = this.getPreviousPage(cursor.previous, cursor.limit, query);
                } else if (cursor.previous === null) {
                    result = this.getFirstPage(cursor.limit, query);
                } else {
                    result = this.getLastPage(cursor.limit, query);
                }

                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    public override getEndpointDocuments(
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
                    sql = this.db.prepare(
                        'SELECT * FROM documents WHERE endpoint = ? AND id >= ? ORDER BY id ASC LIMIT ?',
                    );
                } else {
                    sql = this.db.prepare('SELECT * FROM documents WHERE endpoint = ? ORDER BY id ASC LIMIT ?');
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

    public override update(document: AASDocument): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                this.db.exec('BEGIN');
                const value = this.selectDocumentSql.get(document.endpoint, document.id);
                if (!value) {
                    resolve();
                    return;
                }

                const uuid = String(value.uuid);
                this.updateDocumentSql.run(
                    document.address,
                    document.idShort,
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

    public override insert(document: AASDocument): Promise<void> {
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

    public override find(
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

    public override delete(endpoint: string, id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                this.db.exec('BEGIN');
                const uuid = this.getUuid(endpoint, id);
                if (!uuid) {
                    this.db.exec('COMMIT');
                    resolve(false);
                    return;
                }

                this.deleteElementsSql.run(uuid);
                this.deleteDocumentSql.run(uuid);
                this.db.exec('COMMIT');
                resolve(true);
            } catch (error) {
                this.db.exec('ROLLBACK');
                reject(error);
            }
        });
    }

    public override create(endpoint: string, id: string, env: aas.Environment): Promise<void> {
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

    public override clear(endpoint?: string, id?: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                this.db.exec('BEGIN');
                if (endpoint === undefined) {
                    this.deleteAllElementsSql.run();
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

    public override getSubmodelConceptDescriptionIds(endpoint: string, id: string): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            try {
                const value = this.getConceptDescriptionIdsSql.get(endpoint, id);
                if (!value || !value.conceptDescriptionRefs) {
                    return resolve([]);
                }

                resolve(JSON.parse(String(value.id)) as string[]);
            } catch (error) {
                reject(error);
            }
        });
    }

    public override setSubmodelConceptDescriptionIds(
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
        let loop = true;
        while (loop) {
            const values = this.selectEndpointDocumentsSql.all(endpoint, LIMIT);
            this.deleteEndpointDocumentsSql.run(endpoint);
            for (const value of values) {
                this.deleteElementsSql.run(String(value.uuid));
                this.deleteEndpointConceptDescriptionIdsSql.run(endpoint);
            }

            if (values.length < LIMIT) {
                loop = false;
            }
        }
    }

    public override dispose(): void {
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

    private getFirstPage(limit: number, query?: SqliteQuery): AASPagedResult {
        let sql: StatementSync;
        const params: SQLInputValue[] = [];
        if (query) {
            if (query.joinElements) {
                sql = this.db.prepare(
                    'SELECT DISTINCT documents.* FROM documents INNER JOIN elements ON documents.uuid = elements.uuid WHERE ' +
                        query.createSql(params) +
                        ' ORDER BY CONCAT(endpoint, id) ASC LIMIT ?',
                );
            } else {
                sql = this.db.prepare(
                    'SELECT * FROM documents WHERE ' +
                        query.createSql(params) +
                        ' ORDER BY CONCAT(endpoint, id) ASC LIMIT ?',
                );
            }
        } else {
            sql = this.db.prepare('SELECT * FROM documents ORDER BY CONCAT(endpoint, id) ASC LIMIT ?');
        }

        params.push(limit + 1);
        const values = sql.all(...params);
        const documents = values.map(result => this.toDocument(result));

        return {
            previous: null,
            documents: documents.slice(0, limit),
            next: documents.length >= limit + 1 ? this.toDocumentId(documents[limit]) : null,
        };
    }

    private getNextPage(current: AASDocumentId, limit: number, query?: SqliteQuery): AASPagedResult {
        let sql: StatementSync;
        const params: SQLInputValue[] = [current.endpoint + current.id];

        if (query) {
            if (query.joinElements) {
                sql = this.db.prepare(
                    'SELECT DISTINCT documents.* FROM documents INNER JOIN elements ON documents.uuid = elements.uuid WHERE CONCAT(endpoint, id) >= ? AND (' +
                        query.createSql(params) +
                        ') ORDER BY CONCAT(documents.endpoint, documents.id) ASC LIMIT ?',
                );
            } else {
                sql = this.db.prepare(
                    'SELECT * FROM `documents` WHERE CONCAT(endpoint, id) >= ? AND (' +
                        query.createSql(params) +
                        ') ORDER BY CONCAT(endpoint, id) ASC LIMIT ?;',
                );
            }
        } else {
            sql = this.db.prepare(
                'SELECT * FROM documents WHERE CONCAT(endpoint, id) >= ? ORDER BY CONCAT(endpoint, id) ASC LIMIT ?',
            );
        }

        params.push(limit + 1);
        const values = sql.all(...params);
        const documents = values.map(result => this.toDocument(result));

        return {
            previous: current,
            documents: documents.slice(0, limit),
            next: documents.length >= limit + 1 ? this.toDocumentId(documents[limit]) : null,
        };
    }

    private getPreviousPage(current: AASDocumentId, limit: number, query?: SqliteQuery): AASPagedResult {
        let sql: StatementSync;
        const params: SQLInputValue[] = [current.endpoint + current.id];

        if (query) {
            if (query.joinElements) {
                sql = this.db.prepare(
                    'SELECT DISTINCT documents.* FROM documents INNER JOIN elements ON documents.uuid = elements.uuid WHERE CONCAT(endpoint, id) < ? AND (' +
                        query.createSql(params) +
                        ') ORDER BY CONCAT(documents.endpoint, documents.id) DESC LIMIT ?',
                );
            } else {
                sql = this.db.prepare(
                    'SELECT * FROM documents WHERE CONCAT(endpoint, id) < ? AND (' +
                        query.createSql(params) +
                        ') ORDER BY CONCAT(endpoint, id) DESC LIMIT ?',
                );
            }
        } else {
            sql = this.db.prepare(
                'SELECT * FROM documents WHERE CONCAT(endpoint, id) < ? ORDER BY CONCAT(endpoint, id) DESC LIMIT ?',
            );
        }

        params.push(limit + 1);
        const values = sql.all(...params);
        const documents = values.map(result => this.toDocument(result));

        return {
            previous: documents.length >= limit + 1 ? this.toDocumentId(documents[limit - 1]) : null,
            documents: documents.slice(0, limit).reverse(),
            next: current,
        };
    }

    private getLastPage(limit: number, query?: SqliteQuery): AASPagedResult {
        let sql: StatementSync;
        const params: SQLInputValue[] = [];
        if (query) {
            if (query.joinElements) {
                sql = this.db.prepare(
                    'SELECT DISTINCT documents.* FROM `documents` INNER JOIN `elements` ON documents.uuid = elements.uuid WHERE ' +
                        query.createSql(params) +
                        ' ORDER BY CONCAT(documents.endpoint, documents.id) DESC LIMIT ?',
                );
            } else {
                sql = this.db.prepare(
                    'SELECT * FROM `documents` WHERE ' +
                        query.createSql(params) +
                        ' ORDER BY CONCAT(endpoint, id) DESC LIMIT ?',
                );
            }
        } else {
            sql = this.db.prepare('SELECT * FROM `documents` ORDER BY CONCAT(endpoint, id) DESC LIMIT ?');
        }

        params.push(limit + 1);
        const values = sql.all(...params);
        const documents = values.map(result => this.toDocument(result));

        return {
            previous: documents.length >= limit + 1 ? this.toDocumentId(documents[limit - 1]) : null,
            documents: documents.slice(0, limit).reverse(),
            next: null,
        };
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
            this.toAbbreviation(referable),
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

    private toStringValue(referable: aas.Referable, max: number = 512): string | null {
        switch (referable.modelType) {
            case 'Property': {
                const property = referable as aas.Property;
                if (baseType(property.valueType) === 'string') {
                    return this.preprocessString(property.value, max) ?? null;
                }

                return null;
            }
            case 'MultiLanguageProperty':
                return this.preprocessString((referable as aas.MultiLanguageProperty).value) ?? null;
            case 'File':
                return (referable as aas.File).value ?? null;
            case 'Blob':
                return (referable as aas.Blob).contentType;
            case 'Range':
            case 'ReferenceElement':
            default:
                return null;
        }
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
