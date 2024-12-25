/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { v4 } from 'uuid';
import isEmpty from 'lodash-es/isEmpty.js';
import mysql, { Connection, ResultSetHeader } from 'mysql2/promise';
import {
    AASEndpoint,
    AASCursor,
    AASDocument,
    flat,
    aas,
    AASDocumentId,
    isIdentifiable,
    AASPagedResult,
} from 'aas-core';

import { AASIndex } from '../aas-index.js';
import { Variable } from '../../variable.js';
import { MySqlQuery } from './mysql-query.js';
import { DocumentCount, MySqlDocument, MySqlEndpoint } from './mysql-types.js';
import { PagedResult } from '../../types/paged-result.js';
import { KeywordDirectory } from '../keyword-directory.js';
import { Logger } from '../../logging/logger.js';
import { urlToString } from '../../convert.js';

export class MySqlIndex extends AASIndex {
    private _connection!: Connection;

    public constructor(
        private readonly logger: Logger,
        private readonly variable: Variable,
        keywordDirectory: KeywordDirectory,
        connection?: Connection,
    ) {
        super(keywordDirectory);

        if (connection) {
            this._connection = connection;
        }
    }

    public override async destroy(): Promise<void> {
        const connection = await this.getConnection();
        await connection.end();
    }

    public override async getCount(endpoint?: string): Promise<number> {
        const connection = await this.getConnection();
        if (endpoint === undefined) {
            const result = await connection.query<DocumentCount[]>('SELECT COUNT(*) FROM `documents`;');
            return result[0][0]['COUNT(*)'];
        }

        const result = await connection.query<DocumentCount[]>('SELECT COUNT(*) FROM `documents` WHERE endpoint = ?;', [
            endpoint,
        ]);

        return result[0][0]['COUNT(*)'];
    }

    public override async getEndpointCount(): Promise<number> {
        const connection = await this.getConnection();
        const result = await connection.query<DocumentCount[]>('SELECT COUNT(*) FROM `endpoints` AS count;');
        return result[0][0]['COUNT(*)'];
    }

    public override async getEndpoints(): Promise<AASEndpoint[]> {
        const connection = await this.getConnection();
        const result = await connection.query<MySqlEndpoint[]>('SELECT * FROM `endpoints`;');
        return result[0].map(row => this.toEndpoint(row));
    }

    public override async getEndpoint(name: string): Promise<AASEndpoint> {
        const connection = await this.getConnection();
        const [results] = await connection.query<MySqlEndpoint[]>('SELECT * FROM `endpoints` WHERE name = ?;', [name]);
        if (results.length === 0) {
            throw new Error(`An endpoint with the name "${name}" does not exist.`);
        }

        return this.toEndpoint(results[0]);
    }

    public override async findEndpoint(name: string): Promise<AASEndpoint | undefined> {
        const connection = await this.getConnection();
        const [results] = await connection.query<MySqlEndpoint[]>('SELECT * FROM `endpoints` WHERE name = ?;', [name]);
        if (results.length === 0) {
            return undefined;
        }

        return this.toEndpoint(results[0]);
    }

    public override async addEndpoint(endpoint: AASEndpoint): Promise<void> {
        const connection = await this.getConnection();
        await connection.query<ResultSetHeader>(
            'INSERT INTO `endpoints` (name, url, type, version, headers, schedule) VALUES (?, ?, ?, ?, ?, ?);',
            [
                endpoint.name,
                endpoint.url,
                endpoint.type,
                endpoint.version,
                endpoint.headers ? JSON.stringify(endpoint.headers) : undefined,
                endpoint.schedule ? JSON.stringify(endpoint.schedule) : undefined,
            ],
        );
    }

    public override async updateEndpoint(endpoint: AASEndpoint): Promise<AASEndpoint> {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            const [results] = await connection.query<MySqlEndpoint[]>('SELECT * FROM `endpoints` WHERE name = ?;', [
                endpoint.name,
            ]);

            if (results.length === 0) {
                throw new Error(`An endpoint with the name "${endpoint.name}" does not exist.`);
            }

            const old = this.toEndpoint(results[0]);

            await connection.query<ResultSetHeader>(
                'UPDATE `endpoints` SET url = ?, type = ?, version = ?, headers = ?, schedule = ? WHERE name = ?;',
                [
                    endpoint.url,
                    endpoint.type,
                    endpoint.version,
                    endpoint.headers ? JSON.stringify(endpoint.headers) : undefined,
                    endpoint.schedule ? JSON.stringify(endpoint.schedule) : undefined,
                    endpoint.name,
                ],
            );
            await connection.commit();
            return old;
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    }

    public override async removeEndpoint(endpointName: string): Promise<boolean> {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            const result = await connection.query<ResultSetHeader>('DELETE FROM `endpoints` WHERE name = ?;', [
                endpointName,
            ]);

            this.removeDocuments(connection, endpointName);
            await connection.commit();
            return result[0].affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    }

    public override async getDocuments(
        cursor: AASCursor,
        expression?: string,
        language?: string,
    ): Promise<AASPagedResult> {
        let query: MySqlQuery | undefined;
        if (expression) {
            query = new MySqlQuery(expression, language ?? 'en');
        }

        const connection = await this.getConnection();
        if (cursor.next) {
            return this.getNextPage(connection, cursor.next, cursor.limit, query);
        }

        if (cursor.previous) {
            return this.getPreviousPage(connection, cursor.previous, cursor.limit, query);
        }

        if (cursor.previous === null) {
            return this.getFirstPage(connection, cursor.limit, query);
        }

        return this.getLastPage(connection, cursor.limit, query);
    }

    public override async nextPage(
        endpointName: string,
        cursor: string | undefined,
        limit: number = 100,
    ): Promise<PagedResult<AASDocument>> {
        let sql: string;
        const values: unknown[] = [endpointName];
        if (cursor) {
            values.push(cursor);
            sql = 'SELECT * FROM `documents` WHERE endpoint = ? AND id >= ? ORDER BY id ASC LIMIT ?;';
        } else {
            sql = 'SELECT * FROM `documents` WHERE endpoint = ? ORDER BY id ASC LIMIT ?;';
        }

        values.push(limit + 1);
        const connection = await this.getConnection();
        const [results] = await connection.query<MySqlDocument[]>(sql, values);
        const documents = results.map(result => this.toDocument(result));
        return {
            result: documents.slice(0, limit),
            paging_metadata: {
                cursor: documents.length >= limit + 1 ? documents[limit].id : undefined,
            },
        };
    }

    public override async update(document: AASDocument): Promise<void> {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            const result = await connection.query<MySqlDocument[]>(
                'SELECT uuid FROM `documents` WHERE endpoint = ? AND id = ?;',
                [document.endpoint, document.id],
            );

            if (result[0].length === 0) {
                return;
            }

            const uuid = result[0][0].uuid;
            await connection.query<ResultSetHeader>(
                'UPDATE `documents` SET address = ?, crc32 = ?, idShort = ?, timestamp = ?, thumbnail = ? WHERE uuid = ?;',
                [document.address, document.crc32, document.idShort, document.timestamp, document.thumbnail, uuid],
            );

            if (document.content) {
                await connection.query<ResultSetHeader>('DELETE FROM `elements` WHERE uuid = ?;', [uuid]);
                await this.traverseEnvironment(connection, uuid, document.content);
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    }

    public override async add(document: AASDocument): Promise<void> {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            const uuid = v4();
            await connection.query<ResultSetHeader>(
                'INSERT INTO `documents` (uuid, address, crc32, endpoint, id, idShort, assetId, thumbnail, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
                [
                    uuid,
                    document.address,
                    document.crc32,
                    document.endpoint,
                    document.id,
                    document.idShort,
                    document.assetId || null,
                    document.thumbnail || null,
                    BigInt(document.timestamp),
                ],
            );

            if (document.content) {
                await this.traverseEnvironment(connection, uuid, document.content);
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    }

    public override async find(endpoint: string | undefined, id: string): Promise<AASDocument | undefined> {
        const connection = await this.getConnection();
        const document = endpoint
            ? await this.selectEndpointDocument(connection, endpoint, id)
            : await this.selectDocument(connection, id);
        if (!document) {
            return undefined;
        }

        return this.toDocument(document);
    }

    public override async remove(endpointName: string, id: string): Promise<boolean> {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            const [results] = await connection.query<MySqlDocument[]>(
                'SELECT uuid FROM `documents` WHERE endpoint = ? AND id = ?;',
                [endpointName, id],
            );

            if (results.length === 0) {
                return false;
            }

            const uuid = results[0].uuid;
            await connection.query<ResultSetHeader>('DELETE FROM `elements` WHERE uuid = ?;', [uuid]);
            await connection.query<ResultSetHeader>('DELETE FROM `documents` WHERE uuid = ?;', [uuid]);
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            return false;
        }
    }

    public override async clear(endpointName?: string): Promise<void> {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            if (endpointName === undefined) {
                await connection.query<ResultSetHeader>('DELETE FROM `elements`;');
                await connection.query<ResultSetHeader>('DELETE FROM `documents`;');
                await connection.query<ResultSetHeader>('DELETE FROM `endpoints`;');
            } else {
                const documents = (
                    await connection.query<MySqlDocument[]>('SELECT * FROM `documents` WHERE endpoint = ?;', [
                        endpointName,
                    ])
                )[0];

                await connection.query<ResultSetHeader>('DELETE FROM `documents` WHERE endpoint = ?;', [endpointName]);

                for (const document of documents) {
                    await connection.query<ResultSetHeader>('DELETE FROM `elements` WHERE uuid = ?;', [document.uuid]);
                }
            }
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    }

    private async getConnection(): Promise<Connection> {
        if (this._connection === undefined) {
            const url = new URL(this.variable.AAS_INDEX!);
            const username = isEmpty(url.username) ? this.variable.AAS_NODE_USERNAME : url.username;
            const password = isEmpty(url.password) ? this.variable.AAS_NODE_PASSWORD : url.password;
            this._connection = await mysql.createConnection({
                host: url.hostname,
                port: Number(url.port),
                database: 'aas-index',
                user: username,
                password: password,
            });

            this.logger.info(`AAS index connected to ${urlToString(this.variable.AAS_INDEX)}.`);
        }

        return this._connection;
    }

    private async removeDocuments(connection: Connection, endpointName: string): Promise<void> {
        const documents = (
            await connection.query<MySqlDocument[]>('SELECT * FROM `documents` WHERE endpoint = ?;', [endpointName])
        )[0];

        await connection.query<ResultSetHeader>('DELETE FROM `documents` WHERE endpoint = ?;', [endpointName]);

        for (const document of documents) {
            await connection.query<ResultSetHeader>('DELETE FROM `elements` WHERE uuid = ?;', [document.uuid]);
        }
    }

    private async getFirstPage(connection: Connection, limit: number, query?: MySqlQuery): Promise<AASPagedResult> {
        let sql: string;
        const values: unknown[] = [];
        if (query) {
            if (query.joinElements) {
                sql =
                    'SELECT DISTINCT documents.* FROM `documents` INNER JOIN `elements` ON documents.uuid = elements.uuid WHERE ' +
                    query.createSql(values) +
                    ' ORDER BY endpoint ASC, id ASC LIMIT ?;';
            } else {
                sql =
                    'SELECT * FROM `documents` WHERE ' +
                    query.createSql(values) +
                    ' ORDER BY endpoint ASC, id ASC LIMIT ?;';
            }
        } else {
            sql = 'SELECT * FROM `documents` ORDER BY endpoint ASC, id ASC LIMIT ?;';
        }

        values.push(limit + 1);
        const [results] = await connection.query<MySqlDocument[]>(sql, values);
        const documents = results.map(result => this.toDocument(result));

        return {
            previous: null,
            documents: documents.slice(0, limit),
            next: documents.length >= limit + 1 ? this.toDocumentId(documents[limit]) : null,
        };
    }

    private async getNextPage(
        connection: Connection,
        current: AASDocumentId,
        limit: number,
        query?: MySqlQuery,
    ): Promise<AASPagedResult> {
        let sql: string;
        const values: unknown[] = [current.endpoint + current.id];

        if (query) {
            if (query.joinElements) {
                sql =
                    'SELECT DISTINCT documents.* FROM `documents` INNER JOIN `elements` ON documents.uuid = elements.uuid WHERE CONCAT(endpoint, id) >= ? AND (' +
                    query.createSql(values) +
                    ') ORDER BY documents.endpoint ASC, documents.id ASC LIMIT ?;';
            } else {
                sql =
                    'SELECT * FROM `documents` WHERE CONCAT(endpoint, id) >= ? AND (' +
                    query.createSql(values) +
                    ') ORDER BY endpoint ASC, id ASC LIMIT ?;';
            }
        } else {
            sql = 'SELECT * FROM `documents` WHERE CONCAT(endpoint, id) >= ? ORDER BY endpoint ASC, id ASC LIMIT ?;';
        }

        values.push(limit + 1);
        const [results] = await connection.query<MySqlDocument[]>(sql, values);
        const documents = results.map(result => this.toDocument(result));

        return {
            previous: current,
            documents: documents.slice(0, limit),
            next: documents.length >= limit + 1 ? this.toDocumentId(documents[limit]) : null,
        };
    }

    private async getPreviousPage(
        connection: Connection,
        current: AASDocumentId,
        limit: number,
        query?: MySqlQuery,
    ): Promise<AASPagedResult> {
        let sql: string;
        const values: unknown[] = [current.endpoint + current.id];

        if (query) {
            if (query.joinElements) {
                sql =
                    'SELECT DISTINCT documents.* FROM `documents` INNER JOIN `elements` ON documents.uuid = elements.uuid WHERE CONCAT(endpoint, id) < ? AND (' +
                    query.createSql(values) +
                    ') ORDER BY documents.endpoint DESC, documents.id DESC LIMIT ?;';
            } else {
                sql =
                    'SELECT * FROM `documents` WHERE CONCAT(endpoint, id) < ? AND (' +
                    query.createSql(values) +
                    ') ORDER BY endpoint DESC, id DESC LIMIT ?;';
            }
        } else {
            sql = 'SELECT * FROM `documents` WHERE CONCAT(endpoint, id) < ? ORDER BY endpoint DESC, id DESC LIMIT ?;';
        }

        values.push(limit + 1);
        const [results] = await connection.query<MySqlDocument[]>(sql, values);
        const documents = results.map(result => this.toDocument(result));

        return {
            previous: documents.length >= limit + 1 ? this.toDocumentId(documents[0]) : null,
            documents: documents.slice(0, limit).reverse(),
            next: current,
        };
    }

    private async getLastPage(connection: Connection, limit: number, query?: MySqlQuery): Promise<AASPagedResult> {
        let sql: string;
        const values: unknown[] = [];
        if (query) {
            if (query.joinElements) {
                sql =
                    'SELECT DISTINCT documents.* FROM `documents` INNER JOIN `elements` ON documents.uuid = elements.uuid WHERE ' +
                    query.createSql(values) +
                    ' ORDER BY documents.endpoint DESC, documents.id DESC LIMIT ?;';
            } else {
                sql =
                    'SELECT * FROM `documents` WHERE ' +
                    query.createSql(values) +
                    ' ORDER BY endpoint DESC, id DESC LIMIT ?;';
            }
        } else {
            sql = 'SELECT * FROM `documents` ORDER BY endpoint DESC, id DESC LIMIT ?;';
        }

        values.push(limit + 1);
        const [results] = await connection.query<MySqlDocument[]>(sql, values);
        const documents = results.map(result => this.toDocument(result));

        return {
            previous: documents.length >= limit + 1 ? this.toDocumentId(documents[0]) : null,
            documents: documents.slice(0, limit).reverse(),
            next: null,
        };
    }

    private async selectEndpointDocument(
        connection: Connection,
        endpoint: string,
        id: string,
    ): Promise<MySqlDocument | undefined> {
        const [results] = await connection.query<MySqlDocument[]>(
            'SELECT * FROM `documents` WHERE endpoint = ? AND (id = ? OR assetId = ?)',
            [endpoint, id, id],
        );

        if (results.length === 0) {
            return undefined;
        }

        return results[0];
    }

    private async selectDocument(connection: Connection, id: string): Promise<MySqlDocument | undefined> {
        const [results] = await connection.query<MySqlDocument[]>(
            'SELECT * FROM `documents` WHERE (id = ? OR assetId = ?)',
            [id, id],
        );

        if (results.length === 0) {
            return undefined;
        }

        return results[0];
    }

    private async traverseEnvironment(connection: Connection, documentId: string, env: aas.Environment): Promise<void> {
        for (const submodel of env.submodels) {
            for (const referable of flat(submodel)) {
                if (referable.idShort) {
                    await this.writeElement(connection, documentId, referable);
                }
            }
        }
    }

    private async writeElement(connection: Connection, uuid: string, referable: aas.Referable): Promise<void> {
        await connection.query<ResultSetHeader>(
            'INSERT INTO `elements` (uuid, modelType, id, idShort, stringValue, numberValue, dateValue, booleanValue, bigintValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
            [
                uuid,
                this.toAbbreviation(referable),
                isIdentifiable(referable) ? referable.id : undefined,
                referable.idShort,
                this.toStringValue(referable, 512),
                this.toNumberValue(referable),
                this.toDateValue(referable),
                this.toBooleanValue(referable),
                this.toBigintValue(referable),
            ],
        );
    }

    private toEndpoint(result: MySqlEndpoint): AASEndpoint {
        const endpoint: AASEndpoint = {
            name: result.name,
            url: result.url,
            type: result.type,
        };

        if (result.version) {
            endpoint.version = result.version;
        }

        if (result.headers) {
            endpoint.headers = JSON.parse(result.headers);
        }

        if (result.schedule) {
            endpoint.schedule = JSON.parse(result.schedule);
        }

        return endpoint;
    }

    private toDocument(result: MySqlDocument): AASDocument {
        const document: AASDocument = {
            address: result.address,
            crc32: result.crc32,
            endpoint: result.endpoint,
            id: result.id,
            idShort: result.idShort,
            timestamp: Number(result.timestamp),
            content: null,
            onlineReady: true,
            readonly: false,
        };

        if (result.assetId) {
            document.assetId = result.assetId;
        }

        if (result.thumbnail) {
            document.thumbnail = result.thumbnail;
        }

        return document;
    }
}
