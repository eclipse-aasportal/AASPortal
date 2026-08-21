/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { AASDocument, AASEndpoint } from 'aas-core';
import { Logger } from 'aas-package';

import { MySqlIndex } from './mysql-index.js';
import { Variable } from '../../variable.js';
import { KeywordDirectory } from '../keyword-directory.js';
import { DocumentCount, MySqlDocument, MySqlEndpoint, MySqlConceptDescriptionIds } from './mysql-types.js';
import { createSpyObj } from '../../../test/mocks.js';

describe('MySqlIndex', () => {
    let index: MySqlIndex;
    let logger: Mocked<Logger>;
    let variable: Mocked<Variable>;
    let connection: Mocked<PoolConnection>;
    let keywords: Mocked<KeywordDirectory>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'info']);
        variable = createSpyObj<Variable>(
            {},
            { ENDPOINTS: [], AAS_INDEX: 'mysql://user:password@localhost:3306/aas_index' },
        );

        keywords = createSpyObj<KeywordDirectory>(['containedKeyword', 'toString']);
        index = new MySqlIndex(logger, variable, keywords);
        connection = createSpyObj<PoolConnection>(['query', 'beginTransaction', 'commit', 'rollback', 'release']);
        index['getConnection'] = vi.fn().mockResolvedValue(connection);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetAllMocks();
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
            await expect(index.getDocumentCount()).resolves.toEqual(42);
            expect(connection.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM `documents`;');
        });

        it('returns the total number of documents of the specified Endpoint', async () => {
            const result: DocumentCount = {
                constructor: { name: 'RowDataPacket' },
                'COUNT(*)': 42,
            };

            connection.query.mockResolvedValue([[result], []]);
            await expect(index.getDocumentCount('Samples')).resolves.toEqual(42);
            expect(connection.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM `documents` WHERE endpoint = ?;', [
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

            expect(connection.query).toHaveBeenCalledWith('SELECT * FROM `endpoints`;');
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
            expect(connection.query).toHaveBeenCalledWith('SELECT * FROM `endpoints` WHERE name = ?;', ['Endpoint 1']);
            expect(actual).toEqual({
                name: 'Endpoint 1',
                url: 'http://endpoint1.com',
                type: 'AAS_API',
                version: 'v3',
            });
        });

        it('throws an error if endpoint does not exist', async () => {
            connection.query.mockResolvedValue([[], []]);
            await expect(index.getEndpoint('Unknown')).rejects.toThrow();
            expect(connection.query).toHaveBeenCalledWith('SELECT * FROM `endpoints` WHERE name = ?;', ['Unknown']);
        });
    });

    describe('findEndpoint', () => {
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
            await expect(index.findEndpoint('Endpoint 1')).resolves.toBeDefined();
            expect(connection.query).toHaveBeenCalledWith('SELECT * FROM `endpoints` WHERE name = ?;', ['Endpoint 1']);
        });

        it('indicates that Unknown does not exist', async () => {
            connection.query.mockResolvedValue([[], []]);
            await expect(index.findEndpoint('Endpoint 1')).resolves.toBeUndefined();
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

            await expect(index.insertEndpoint(endpoint)).resolves.toEqual(void 0);
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

    describe('deleteEndpoint', () => {
        it('removes the specified endpoint', async () => {
            connection.query.mockImplementation(
                (sql: string | object) =>
                    new Promise((resolve, reject) => {
                        if (sql === 'DELETE FROM `endpoints` WHERE name = ?;') {
                            return resolve([
                                {
                                    affectedRows: 1,
                                } as ResultSetHeader,
                                [],
                            ]);
                        }

                        if (sql === 'SELECT uuid FROM `documents` WHERE endpoint = ?;') {
                            return resolve([[{ uuid: 'uuid1' } as MySqlDocument], []]);
                        }

                        if (sql === 'DELETE FROM `documents` WHERE endpoint = ?;') {
                            return resolve([[], []]);
                        }

                        if (sql === 'DELETE FROM `elements` WHERE uuid = ?;') {
                            return resolve([[], []]);
                        }

                        reject(new Error(`Unexpected sql: ${sql}`));
                    }),
            );

            await expect(index.deleteEndpoint('Endpoint 1')).resolves.toEqual(true);
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
            await expect(index.getEndpointDocuments('Endpoint 1', undefined, 10)).resolves.toEqual({
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
        it('updates a document in the index', async () => {
            connection.query.mockImplementation(
                (sql: string | object) =>
                    new Promise(resolve => {
                        const query = String(sql);
                        if (query === 'SELECT uuid FROM `documents` WHERE endpoint = ? AND id = ?;') {
                            return resolve([[{ uuid: '1' } as MySqlDocument], []]);
                        }

                        return resolve([[], []]);
                    }),
            );

            await expect(
                index.update({
                    endpoint: 'Endpoint 1',
                    id: 'http://document/aas',
                    address: 'address',
                    idShort: 'idShort',
                    timestamp: 123,
                } satisfies AASDocument),
            ).resolves.toEqual(void 0);

            expect(connection.beginTransaction).toHaveBeenCalled();
            expect(connection.query).toHaveBeenCalledTimes(2);
            expect(connection.commit).toHaveBeenCalled();
        });
    });

    describe('insert', () => {
        it('inserts a document into the index', async () => {
            connection.query.mockResolvedValue([[], []]);
            await expect(
                index.insert({
                    endpoint: 'Endpoint 1',
                    id: 'http://document/aas',
                    address: 'address',
                    idShort: 'idShort',
                    timestamp: 123,
                } satisfies AASDocument),
            ).resolves.toEqual(void 0);

            expect(connection.beginTransaction).toHaveBeenCalled();
            expect(connection.query).toHaveBeenCalled();
            expect(connection.commit).toHaveBeenCalled();
        });
    });

    describe('find', () => {
        it('finds a document in the index', async () => {
            const result: MySqlDocument = {
                constructor: { name: 'RowDataPacket' },
                uuid: '1',
                id: 'http://document/aas',
                endpoint: 'Endpoint 1',
                address: 'address',
                idShort: 'idShort',
                assetId: 'assetId',
                thumbnail: null,
                timestamp: 123,
            };

            connection.query.mockResolvedValue([[result], []]);
            await expect(index.find('Endpoint 1', 'AssetAdministrationShell', 'http://document/aas')).resolves.toEqual({
                endpoint: 'Endpoint 1',
                id: 'http://document/aas',
                address: 'address',
                idShort: 'idShort',
                assetId: 'assetId',
                content: null,
                timestamp: 123,
            } satisfies AASDocument);
        });
    });

    describe('delete', () => {
        it('deletes a document from the index', async () => {
            connection.query.mockImplementation(
                (sql: string | object) =>
                    new Promise(resolve => {
                        const query = String(sql);
                        if (query === 'SELECT uuid FROM `documents` WHERE endpoint = ? AND id = ?;') {
                            return resolve([[{ uuid: '1' } as MySqlDocument], []]);
                        }

                        if (query === 'DELETE FROM `elements` WHERE uuid = ?;') {
                            return resolve([[], []]);
                        }

                        resolve([[], []]);
                    }),
            );

            await expect(index.delete('Endpoint 1', 'http://document/aas')).resolves.toEqual(true);
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
            expect(connection.commit).toHaveBeenCalled();
        });
    });

    describe('getSubmodelConceptDescriptionIds', () => {
        it('gets the identifiers of the concept descriptions that belongs to a submodel', async () => {
            const result = {
                conceptDescriptionIds: JSON.stringify(['concept-description-1', 'concept-description-2']),
            } as MySqlConceptDescriptionIds;

            connection.query.mockResolvedValue([[result], []]);
            await expect(index.getSubmodelConceptDescriptionIds('Endpoint 1', 'submodel-1')).resolves.toEqual([
                'concept-description-1',
                'concept-description-2',
            ]);
        });
    });

    describe('setSubmodelConceptDescriptionIds', () => {
        it('inserts the identifiers of the concept descriptions that belongs to a submodel', async () => {
            connection.query.mockResolvedValue([[], []]);
            await index.setSubmodelConceptDescriptionIds('Endpoint 1', 'submodel-1', ['concept-description-1']);
            expect(connection.query).toHaveBeenLastCalledWith(
                'INSERT INTO `submodelConceptDescriptions` (endpoint, id, conceptDescriptionIds) VALUES (?, ?, ?);',
                ['Endpoint 1', 'submodel-1', JSON.stringify(['concept-description-1'])],
            );
        });

        it('updates the identifiers of the concept descriptions that belongs to a submodel', async () => {
            const result = {
                conceptDescriptionIds: JSON.stringify(['concept-description-1']),
            } as MySqlConceptDescriptionIds;

            connection.query.mockResolvedValue([[result], []]);
            await index.setSubmodelConceptDescriptionIds('Endpoint 1', 'submodel-1', ['concept-description-2']);
            expect(connection.query).toHaveBeenLastCalledWith(
                'UPDATE `submodelConceptDescriptions` SET conceptDescriptionIds = ? WHERE endpoint = ? AND id = ?;',
                [JSON.stringify(['concept-description-2']), 'Endpoint 1', 'submodel-1'],
            );
        });
    });
});
