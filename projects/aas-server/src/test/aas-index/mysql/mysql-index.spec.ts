/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Connection } from 'mysql2/promise';
import { createSpyObj } from 'fhg-jest';
import { AASEndpoint } from 'aas-core';
import { MySqlIndex } from '../../../app/aas-index/mysql/mysql-index.js';
import { Logger } from '../../../app/logging/logger.js';
import { Variable } from '../../../app/variable.js';
import { KeywordDirectory } from '../../../app/aas-index/keyword-directory.js';
import { DocumentCount, MySqlDocument, MySqlEndpoint } from '../../../app/aas-index/mysql/mysql-types.js';

describe('MySqlIndex', () => {
    let index: MySqlIndex;
    let logger: jest.Mocked<Logger>;
    let variable: jest.Mocked<Variable>;
    let connection: jest.Mocked<Connection>;
    let keywords: jest.Mocked<KeywordDirectory>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'info']);
        variable = createSpyObj<Variable>({}, { ENDPOINTS: [] });
        keywords = createSpyObj<KeywordDirectory>(['containedKeyword', 'toString']);
        connection = createSpyObj<Connection>(['query', 'beginTransaction', 'commit', 'rollback']);
        index = new MySqlIndex(logger, variable, keywords, connection);
    });

    it('should be created', () => {
        expect(index).toBeTruthy();
    });

    describe('getCount', () => {
        it('returns the total number of documents', async () => {
            const result: DocumentCount = {
                constructor: { name: 'RowDataPacket' },
                'COUNT(*)': 42,
            };

            connection.query.mockResolvedValue([[result], []]);
            await expect(index.getCount()).resolves.toEqual(42);
            expect(connection.query).toBeCalledWith('SELECT COUNT(*) FROM `documents`;');
        });

        it('returns the total number of documents of the specified Endpoint', async () => {
            const result: DocumentCount = {
                constructor: { name: 'RowDataPacket' },
                'COUNT(*)': 42,
            };

            connection.query.mockResolvedValue([[result], []]);
            await expect(index.getCount('Samples')).resolves.toEqual(42);
            expect(connection.query).toBeCalledWith('SELECT COUNT(*) FROM `documents` WHERE endpoint = ?;', [
                'Samples',
            ]);
        });
    });

    describe('getEndpoints', () => {
        it('returns all registered endpoints', async () => {
            const result: MySqlEndpoint[] = [
                {
                    constructor: { name: 'RowDataPacket' },
                    name: 'Endpoint 1',
                    url: 'http://endpoint1.com',
                    type: 'AAS_API',
                    version: 'v3',
                    headers: null,
                    schedule: null,
                },
                {
                    constructor: { name: 'RowDataPacket' },
                    name: 'Endpoint 2',
                    url: 'http://endpoint2.com',
                    type: 'AAS_API',
                    version: 'v3',
                    headers: null,
                    schedule: null,
                },
            ];

            connection.query.mockResolvedValue([result, []]);
            await expect(index.getEndpoints()).resolves.toEqual([
                {
                    name: 'Endpoint 1',
                    url: 'http://endpoint1.com',
                    type: 'AAS_API',
                    version: 'v3',
                },
                {
                    name: 'Endpoint 2',
                    url: 'http://endpoint2.com',
                    type: 'AAS_API',
                    version: 'v3',
                },
            ]);

            expect(connection.query).toBeCalledWith('SELECT * FROM `endpoints`;');
        });
    });

    describe('getEndpoint', () => {
        it('returns the endpoint with the specified name', async () => {
            const result: MySqlEndpoint = {
                constructor: { name: 'RowDataPacket' },
                name: 'Endpoint 1',
                url: 'http://endpoint1.com',
                type: 'AAS_API',
                version: 'v3',
                headers: null,
                schedule: null,
            };

            connection.query.mockResolvedValue([[result], []]);
            const actual = await index.getEndpoint('Endpoint 1');
            expect(connection.query).toBeCalledWith('SELECT * FROM `endpoints` WHERE name = ?;', ['Endpoint 1']);
            expect(actual).toEqual({
                name: 'Endpoint 1',
                url: 'http://endpoint1.com',
                type: 'AAS_API',
                version: 'v3',
            });
        });

        it('throws an error if endpoint does not exist', async () => {
            connection.query.mockResolvedValue([[], []]);
            await expect(index.getEndpoint('Unknown')).rejects.toThrowError();
            expect(connection.query).toBeCalledWith('SELECT * FROM `endpoints` WHERE name = ?;', ['Unknown']);
        });
    });

    describe('hasEndpoint', () => {
        it('indicates that Endpoint 1 exists', async () => {
            const result: MySqlEndpoint = {
                constructor: { name: 'RowDataPacket' },
                name: 'Endpoint 1',
                url: 'http://endpoint1.com',
                type: 'AAS_API',
                version: 'v3',
                headers: null,
                schedule: null,
            };

            connection.query.mockResolvedValue([[result], []]);
            await expect(index.hasEndpoint('Endpoint 1')).resolves.toEqual(true);
            expect(connection.query).toBeCalledWith('SELECT * FROM `endpoints` WHERE name = ?;', ['Endpoint 1']);
        });

        it('indicates that Unknown does not exist', async () => {
            connection.query.mockResolvedValue([[], []]);
            await expect(index.hasEndpoint('Endpoint 1')).resolves.toEqual(false);
            expect(connection.query).toHaveBeenCalledWith('SELECT * FROM `endpoints` WHERE name = ?;', ['Endpoint 1']);
        });
    });

    describe('addEndpoint', () => {
        it('adds a new Endpoint', async () => {
            const endpoint: AASEndpoint = {
                name: 'Endpoint 1',
                url: 'http://endpoint1.com',
                type: 'AAS_API',
            };

            await expect(index.addEndpoint(endpoint)).resolves.toEqual(void 0);
            expect(connection.query).toHaveBeenCalledWith(
                'INSERT INTO `endpoints` (name, url, type, version, headers, schedule) VALUES (?, ?, ?, ?, ?, ?);',
                [endpoint.name, endpoint.url, endpoint.type, undefined, undefined, undefined],
            );
        });
    });

    describe('updateEndpoint', () => {
        it('updates an existing Endpoint', async () => {
            const endpoint: AASEndpoint = {
                name: 'Endpoint 1',
                url: 'http://endpoint1.com',
                type: 'AAS_API',
            };

            const result: MySqlEndpoint = {
                constructor: { name: 'RowDataPacket' },
                name: 'Endpoint 1',
                url: 'http://endpoint1.com',
                type: 'AAS_API',
                version: 'v3',
                headers: null,
                schedule: null,
            };

            connection.query.mockResolvedValue([[result], []]);
            await expect(index.updateEndpoint(endpoint)).resolves.toEqual({
                name: 'Endpoint 1',
                url: 'http://endpoint1.com',
                type: 'AAS_API',
                version: 'v3',
            });

            expect(connection.query).toHaveBeenNthCalledWith(1, 'SELECT * FROM `endpoints` WHERE name = ?;', [
                'Endpoint 1',
            ]);

            expect(connection.query).toHaveBeenNthCalledWith(
                2,
                'UPDATE `endpoints` SET url = ?, type = ?, version = ?, headers = ?, schedule = ? WHERE name = ?;',
                [endpoint.url, endpoint.type, undefined, undefined, undefined, endpoint.name],
            );
        });
    });

    describe('removeEndpoint', () => {
        it('removes the specified endpoint', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const impl: any = (sql: string): Promise<any> => {
                if (sql === 'DELETE FROM `endpoints` WHERE name = ?;') {
                    return Promise.resolve([
                        {
                            constructor: { name: 'ResultSetHeader' },
                            affectedRows: 1,
                            fieldCount: 0,
                            info: '',
                            insertId: 0,
                            serverStatus: 0,
                            warningStatus: 0,
                            changedRows: 0,
                        },
                    ]);
                }

                if (sql === 'SELECT * FROM `documents` WHERE endpoint = ?;') {
                    return Promise.resolve([[{ uuid: 'uuid1' }]]);
                }

                if (sql === 'DELETE FROM `documents` WHERE endpoint = ?;') {
                    return Promise.resolve();
                }

                if (sql === 'DELETE FROM `elements` WHERE uuid = ?;') {
                    return Promise.resolve();
                }

                return Promise.reject(new Error(`Unexpected sql: ${sql}`));
            };

            connection.query.mockImplementation(impl);
            await expect(index.removeEndpoint('Endpoint 1')).resolves.toEqual(true);
            expect(connection.query).toHaveBeenCalledTimes(4);
        });
    });

    describe('getDocuments', () => {
        it.todo('gets the first');
    });

    describe('nextPage', () => {
        it('selects the first page', async () => {
            const results: MySqlDocument[] = [];
            connection.query.mockResolvedValue([results, []]);
            await expect(index.nextPage('Endpoint 1', undefined, 10)).resolves.toEqual({
                paging_metadata: { cursor: undefined },
                result: [],
            });

            expect(connection.query).toHaveBeenLastCalledWith(
                'SELECT * FROM `documents` WHERE endpoint = ? ORDER BY id ASC LIMIT ?;',
                ['Endpoint 1', 11],
            );
        });
    });

    describe('update', () => {
        it.todo('update');
    });

    describe('add', () => {
        it.todo('add');
    });

    describe('find', () => {
        it.todo('find');
    });

    describe('remove', () => {
        it('removes a document from the index', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const impl: any = (sql: string): Promise<any> => {
                if (sql === 'SELECT uuid FROM `documents` WHERE endpoint = ? AND id = ?;') {
                    const results: MySqlDocument[] = [
                        {
                            constructor: { name: 'RowDataPacket' },
                            uuid: '1',
                            address: '',
                            crc32: 0,
                            idShort: 'Shell 1',
                            assetId: null,
                            thumbnail: null,
                            timestamp: 0,
                            id: 'http://document1/aas',
                            endpoint: 'Endpoint 1',
                        },
                        {
                            constructor: { name: 'RowDataPacket' },
                            uuid: '2',
                            address: '',
                            crc32: 0,
                            idShort: 'Shell 2',
                            assetId: null,
                            thumbnail: null,
                            timestamp: 0,
                            id: 'http://document2/aas',
                            endpoint: 'Endpoint 1',
                        },
                    ];

                    return Promise.resolve([results]);
                }

                if (sql === 'DELETE FROM `elements` WHERE uuid = ?;') {
                    return Promise.resolve();
                }

                if (sql === 'DELETE FROM `documents` WHERE uuid = ?;') {
                    return Promise.resolve();
                }

                return Promise.reject(new Error(`Unexpected sql: ${sql}`));
            };

            connection.query.mockImplementation(impl);
            await expect(index.remove('Endpoint 1', 'http://document/aas')).resolves.toEqual(true);
            expect(connection.beginTransaction).toHaveBeenCalled();
            expect(connection.commit).toHaveBeenCalled();
        });
    });

    describe('clear', () => {
        it('clears the index', async () => {
            connection.query.mockResolvedValue([[], []]);
            await expect(index.clear()).resolves.toEqual(void 0);
            expect(connection.beginTransaction).toHaveBeenCalled();
            expect(connection.query).toHaveBeenNthCalledWith(1, 'DELETE FROM `elements`;');
            expect(connection.query).toHaveBeenNthCalledWith(2, 'DELETE FROM `documents`;');
            expect(connection.query).toHaveBeenNthCalledWith(3, 'DELETE FROM `endpoints`;');
            expect(connection.commit).toHaveBeenCalled();
        });
    });

    describe('reset', () => {
        it('resets the index', async () => {
            connection.query.mockResolvedValue([[], []]);
            await expect(index.reset()).resolves.toEqual(void 0);
            expect(connection.beginTransaction).toHaveBeenCalled();
            expect(connection.commit).toHaveBeenCalled();
        });
    });
});
