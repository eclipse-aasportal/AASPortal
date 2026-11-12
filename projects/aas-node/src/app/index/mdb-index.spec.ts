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
import { LOGGER, Logger } from 'aas-package';

import { DocumentCount, MdbConceptDescriptionIds, MdbDocument, MdbEndpoint, MdbIndex } from './mdb-index.js';
import { Variable } from '../variable.js';
import { createSpyObj } from '../../test/mocks.js';
import { container } from 'tsyringe';

function createResults(endpoint: string, count: number, start: number = 1): MdbDocument[] {
    const results: MdbDocument[] = [];
    for (let i = start, n = start + count; i < n; i++) {
        {
            results.push({
                constructor: { name: 'RowDataPacket' },
                uuid: `aas-${i}`,
                id: `http://document/aas-${i}`,
                endpoint: endpoint,
                address: `address-${i}`,
                idShort: `idShort-${i}`,
                assetId: `assetId-${i}`,
                thumbnail: null,
                timestamp: new Date(123456789),
            });
        }
    }

    return results;
}

function toDocuments(results: MdbDocument[]): AASDocument[] {
    return results.map(
        result =>
            ({
                address: result.address,
                endpoint: result.endpoint,
                id: result.id,
                idShort: result.idShort,
                assetId: result.assetId!,
                thumbnail: undefined,
                timestamp: result.timestamp.getTime(),
                content: null,
            }) satisfies AASDocument,
    );
}

describe('MdbIndex', () => {
    let index: MdbIndex;
    let logger: Mocked<Logger>;
    let variable: Mocked<Variable>;
    let connection: Mocked<PoolConnection>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'info']);
        variable = createSpyObj<Variable>(
            {},
            { ENDPOINTS: [], AAS_INDEX: 'mysql://user:password@localhost:3306/aas_index' },
        );

        connection = createSpyObj<PoolConnection>(['query', 'beginTransaction', 'commit', 'rollback', 'release']);

        container.clearInstances();
        container.registerInstance(LOGGER, logger);
        container.registerInstance(Variable, variable);
        container.registerSingleton(MdbIndex);
        index = container.resolve(MdbIndex);
        index['getConnection'] = vi.fn().mockResolvedValue(connection);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetAllMocks();
        vi.clearAllMocks();
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
            expect(connection.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM documents;');
        });

        it('returns the total number of documents of the specified Endpoint', async () => {
            const result: DocumentCount = {
                constructor: { name: 'RowDataPacket' },
                'COUNT(*)': 42,
            };

            connection.query.mockResolvedValue([[result], []]);
            await expect(index.getDocumentCount('Samples')).resolves.toEqual(42);
            expect(connection.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM documents WHERE endpoint = ?;', [
                'Samples',
            ]);
        });
    });

    describe('getEndpointCount', () => {
        it('returns the total number of endpoints', async () => {
            const result: DocumentCount = {
                constructor: { name: 'RowDataPacket' },
                'COUNT(*)': 42,
            };

            connection.query.mockResolvedValue([[result], []]);
            await expect(index.getEndpointCount()).resolves.toEqual(42);
            expect(connection.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM endpoints AS count;');
            expect(connection.release).toHaveBeenCalledTimes(1);
        });
    });

    describe('getEndpoints', () => {
        it('returns all registered endpoints', async () => {
            const result: MdbEndpoint[] = [
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

            expect(connection.query).toHaveBeenCalledWith('SELECT * FROM endpoints;');
        });
    });

    describe('getEndpoint', () => {
        it('returns the endpoint with the specified name', async () => {
            const result: MdbEndpoint = {
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
            expect(connection.query).toHaveBeenCalledWith('SELECT * FROM endpoints WHERE name = ?;', ['Endpoint 1']);
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
            expect(connection.query).toHaveBeenCalledWith('SELECT * FROM endpoints WHERE name = ?;', ['Unknown']);
        });
    });

    describe('findEndpoint', () => {
        it('indicates that Endpoint 1 exists', async () => {
            const result: MdbEndpoint = {
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
            expect(connection.query).toHaveBeenCalledWith('SELECT * FROM endpoints WHERE name = ?;', ['Endpoint 1']);
        });

        it('indicates that Unknown does not exist', async () => {
            connection.query.mockResolvedValue([[], []]);
            await expect(index.findEndpoint('Endpoint 1')).resolves.toBeUndefined();
            expect(connection.query).toHaveBeenCalledWith('SELECT * FROM endpoints WHERE name = ?;', ['Endpoint 1']);
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
                'INSERT INTO endpoints (name, url, type, version, headers, schedule) VALUES (?, ?, ?, ?, ?, ?);',
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

            const result: MdbEndpoint = {
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

            expect(connection.query).toHaveBeenNthCalledWith(1, 'SELECT * FROM endpoints WHERE name = ?;', [
                'Endpoint 1',
            ]);

            expect(connection.query).toHaveBeenNthCalledWith(
                2,
                'UPDATE endpoints SET url = ?, type = ?, version = ?, headers = ?, schedule = ? WHERE name = ?;',
                [endpoint.url, endpoint.type, undefined, undefined, undefined, endpoint.name],
            );
        });
    });

    describe('deleteEndpoint', () => {
        it('removes the specified endpoint', async () => {
            connection.query.mockImplementation(
                (sql: string | object) =>
                    new Promise((resolve, reject) => {
                        if (sql === 'DELETE FROM endpoints WHERE name = ?;') {
                            return resolve([
                                {
                                    affectedRows: 1,
                                } as ResultSetHeader,
                                [],
                            ]);
                        }

                        if (sql === 'SELECT uuid FROM documents WHERE endpoint = ?;') {
                            return resolve([[{ uuid: 'uuid1' } as MdbDocument], []]);
                        }

                        if (sql === 'DELETE FROM documents WHERE endpoint = ?;') {
                            return resolve([[], []]);
                        }

                        if (sql === 'DELETE FROM `submodelConceptDescriptions` WHERE endpoint = ?;') {
                            return resolve([[], []]);
                        }

                        if (sql === 'DELETE FROM elements WHERE uuid = ?;') {
                            return resolve([[], []]);
                        }

                        reject(new Error(`Unexpected sql: ${sql}`));
                    }),
            );

            await expect(index.deleteEndpoint('Endpoint 1')).resolves.toEqual(true);
            expect(connection.query).toHaveBeenCalledTimes(5);
        });
    });

    describe('getDocuments', () => {
        let data: MdbDocument[];

        beforeEach(() => {
            data = createResults('Endpoint 1', 25);
        });

        describe('no filter applied', () => {
            it('returns the 3 pages forward', async () => {
                connection.query.mockResolvedValue([data.slice(0, 11), []]);
                await expect(index.getDocuments({ previous: null, limit: 10 })).resolves.toEqual({
                    documents: toDocuments(data.slice(0, 10)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-11',
                    },
                    previous: null,
                });

                expect(connection.query).toHaveBeenCalledWith(
                    'SELECT * FROM documents ORDER BY endpoint, id LIMIT ?;',
                    [11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(10, 21), []]);
                await expect(
                    index.getDocuments({ next: { endpoint: 'Endpoint 1', id: 'http://document/aas-11' }, limit: 10 }),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(10, 20)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-21',
                    },
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-11',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    'SELECT * FROM documents WHERE (endpoint > ? OR (endpoint = ? AND id >= ?)) ORDER BY endpoint, id LIMIT ?;',
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-11', 11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(20), []]);
                await expect(
                    index.getDocuments({ next: { endpoint: 'Endpoint 1', id: 'http://document/aas-21' }, limit: 10 }),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(20)),
                    next: null,
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-21',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    'SELECT * FROM documents WHERE (endpoint > ? OR (endpoint = ? AND id >= ?)) ORDER BY endpoint, id LIMIT ?;',
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-21', 11],
                );
            });

            it('returns the 3 pages backward', async () => {
                connection.query.mockResolvedValue([data.slice(14).reverse(), []]);
                await expect(index.getDocuments({ next: null, limit: 10 }, [])).resolves.toEqual({
                    documents: toDocuments(data.slice(15)),
                    next: null,
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-16',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    'SELECT * FROM documents ORDER BY endpoint DESC, id DESC LIMIT ?;',
                    [11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(4, 15).reverse(), []]);
                await expect(
                    index.getDocuments({
                        previous: { endpoint: 'Endpoint 1', id: 'http://document/aas-16' },
                        limit: 10,
                    }),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(5, 15)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-16',
                    },
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-6',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    'SELECT * FROM documents WHERE (endpoint < ? OR (endpoint = ? AND id < ?)) ORDER BY endpoint DESC, id DESC LIMIT ?;',
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-16', 11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(0, 5).reverse(), []]);
                await expect(
                    index.getDocuments({
                        previous: { endpoint: 'Endpoint 1', id: 'http://document/aas-6' },
                        limit: 10,
                    }),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(0, 5)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-6',
                    },
                    previous: null,
                });

                expect(connection.query).toHaveBeenCalledWith(
                    'SELECT * FROM documents WHERE (endpoint < ? OR (endpoint = ? AND id < ?)) ORDER BY endpoint DESC, id DESC LIMIT ?;',
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-6', 11],
                );
            });
        });

        describe('Endpoint 1', () => {
            it('returns the 3 pages forward', async () => {
                connection.query.mockResolvedValue([data.slice(0, 11), []]);
                await expect(index.getDocuments({ previous: null, limit: 10 }, ['Endpoint 1'])).resolves.toEqual({
                    documents: toDocuments(data.slice(0, 10)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-11',
                    },
                    previous: null,
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT * FROM documents WHERE endpoint IN ('Endpoint 1') ORDER BY endpoint, id LIMIT ?;",
                    [11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(10, 21), []]);
                await expect(
                    index.getDocuments({ next: { endpoint: 'Endpoint 1', id: 'http://document/aas-11' }, limit: 10 }, [
                        'Endpoint 1',
                    ]),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(10, 20)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-21',
                    },
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-11',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT * FROM documents WHERE endpoint IN ('Endpoint 1') AND (endpoint > ? OR (endpoint = ? AND id >= ?)) ORDER BY endpoint, id LIMIT ?;",
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-11', 11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(20), []]);
                await expect(
                    index.getDocuments({ next: { endpoint: 'Endpoint 1', id: 'http://document/aas-21' }, limit: 10 }, [
                        'Endpoint 1',
                    ]),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(20)),
                    next: null,
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-21',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT * FROM documents WHERE endpoint IN ('Endpoint 1') AND (endpoint > ? OR (endpoint = ? AND id >= ?)) ORDER BY endpoint, id LIMIT ?;",
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-21', 11],
                );
            });

            it('returns the 3 pages backward', async () => {
                connection.query.mockResolvedValue([data.slice(14).reverse(), []]);
                await expect(index.getDocuments({ next: null, limit: 10 }, ['Endpoint 1'])).resolves.toEqual({
                    documents: toDocuments(data.slice(15)),
                    next: null,
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-16',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT * FROM documents WHERE endpoint IN ('Endpoint 1') ORDER BY endpoint DESC, id DESC LIMIT ?;",
                    [11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(4, 15).reverse(), []]);
                await expect(
                    index.getDocuments(
                        { previous: { endpoint: 'Endpoint 1', id: 'http://document/aas-16' }, limit: 10 },
                        ['Endpoint 1'],
                    ),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(5, 15)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-16',
                    },
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-6',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT * FROM documents WHERE endpoint IN ('Endpoint 1') AND (endpoint < ? OR (endpoint = ? AND id < ?)) ORDER BY endpoint DESC, id DESC LIMIT ?;",
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-16', 11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(0, 5).reverse(), []]);
                await expect(
                    index.getDocuments(
                        { previous: { endpoint: 'Endpoint 1', id: 'http://document/aas-6' }, limit: 10 },
                        ['Endpoint 1'],
                    ),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(0, 5)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-6',
                    },
                    previous: null,
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT * FROM documents WHERE endpoint IN ('Endpoint 1') AND (endpoint < ? OR (endpoint = ? AND id < ?)) ORDER BY endpoint DESC, id DESC LIMIT ?;",
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-6', 11],
                );
            });
        });

        describe('model type filter applied', () => {
            it('returns the 3 pages forward', async () => {
                connection.query.mockResolvedValue([data.slice(0, 11), []]);
                await expect(
                    index.getDocuments({ previous: null, limit: 10 }, undefined, '#prop:torque=114.7'),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(0, 10)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-11',
                    },
                    previous: null,
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT d.* FROM documents AS d WHERE EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (e.modelType = 'prop' AND e.idShort LIKE ? AND e.numberValue = ?)) ORDER BY d.endpoint, d.id LIMIT ?;",
                    ['%torque%', 114.7, 11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(10, 21), []]);
                await expect(
                    index.getDocuments(
                        { next: { endpoint: 'Endpoint 1', id: 'http://document/aas-11' }, limit: 10 },
                        undefined,
                        '#prop:torque=114.7',
                    ),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(10, 20)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-21',
                    },
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-11',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT d.* FROM documents AS d WHERE (d.endpoint > ? OR (d.endpoint = ? AND d.id >= ?)) AND (EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (e.modelType = 'prop' AND e.idShort LIKE ? AND e.numberValue = ?))) ORDER BY d.endpoint, d.id LIMIT ?;",
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-11', '%torque%', 114.7, 11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(20), []]);
                await expect(
                    index.getDocuments(
                        { next: { endpoint: 'Endpoint 1', id: 'http://document/aas-21' }, limit: 10 },
                        undefined,
                        '#prop:torque=114.7',
                    ),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(20)),
                    next: null,
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-21',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT d.* FROM documents AS d WHERE (d.endpoint > ? OR (d.endpoint = ? AND d.id >= ?)) AND (EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (e.modelType = 'prop' AND e.idShort LIKE ? AND e.numberValue = ?))) ORDER BY d.endpoint, d.id LIMIT ?;",
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-21', '%torque%', 114.7, 11],
                );
            });

            it('returns the 3 pages backward', async () => {
                connection.query.mockResolvedValue([data.slice(14).reverse(), []]);
                await expect(
                    index.getDocuments({ next: null, limit: 10 }, undefined, '#prop:torque=114.7'),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(15)),
                    next: null,
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-16',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT d.* FROM documents AS d WHERE EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (e.modelType = 'prop' AND e.idShort LIKE ? AND e.numberValue = ?)) ORDER BY d.endpoint DESC, d.id DESC LIMIT ?;",
                    ['%torque%', 114.7, 11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(4, 15).reverse(), []]);
                await expect(
                    index.getDocuments(
                        {
                            previous: { endpoint: 'Endpoint 1', id: 'http://document/aas-16' },
                            limit: 10,
                        },
                        undefined,
                        '#prop:torque=114.7',
                    ),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(5, 15)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-16',
                    },
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-6',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT d.* FROM documents AS d WHERE (d.endpoint < ? OR (d.endpoint = ? AND d.id < ?)) AND (EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (e.modelType = 'prop' AND e.idShort LIKE ? AND e.numberValue = ?))) ORDER BY d.endpoint DESC, d.id DESC LIMIT ?;",
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-16', '%torque%', 114.7, 11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(0, 5).reverse(), []]);
                await expect(
                    index.getDocuments(
                        {
                            previous: { endpoint: 'Endpoint 1', id: 'http://document/aas-6' },
                            limit: 10,
                        },
                        undefined,
                        '#prop:torque=114.7',
                    ),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(0, 5)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-6',
                    },
                    previous: null,
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT d.* FROM documents AS d WHERE (d.endpoint < ? OR (d.endpoint = ? AND d.id < ?)) AND (EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (e.modelType = 'prop' AND e.idShort LIKE ? AND e.numberValue = ?))) ORDER BY d.endpoint DESC, d.id DESC LIMIT ?;",
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-6', '%torque%', 114.7, 11],
                );
            });
        });

        describe('full text search, Endpoint 1', () => {
            it('returns the 3 pages forward', async () => {
                connection.query.mockResolvedValue([data.slice(0, 11), []]);
                await expect(
                    index.getDocuments({ previous: null, limit: 10 }, ['Endpoint 1'], 'hello world'),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(0, 10)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-11',
                    },
                    previous: null,
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT d.* FROM documents AS d WHERE d.endpoint IN ('Endpoint 1') AND " +
                        '(MATCH(d.idShort, d.id, d.assetId) AGAINST(? IN BOOLEAN MODE) OR EXISTS ' +
                        '(SELECT 1 FROM elements AS e WHERE e.uuid = d.uuid AND MATCH(e.id, e.idShort, e.stringValue) ' +
                        'AGAINST(? IN BOOLEAN MODE))) ORDER BY d.endpoint, d.id LIMIT ?;',
                    ['hello world', 'hello world', 11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(10, 21), []]);
                await expect(
                    index.getDocuments(
                        { next: { endpoint: 'Endpoint 1', id: 'http://document/aas-11' }, limit: 10 },
                        ['Endpoint 1'],
                        'hello world',
                    ),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(10, 20)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-21',
                    },
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-11',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT d.* FROM documents AS d WHERE d.endpoint IN ('Endpoint 1') AND (d.endpoint > ? OR (d.endpoint = ? AND d.id >= ?)) AND (MATCH(d.idShort, d.id, d.assetId) AGAINST(? IN BOOLEAN MODE) OR EXISTS (SELECT 1 FROM elements AS e WHERE e.uuid = d.uuid AND MATCH(e.id, e.idShort, e.stringValue) AGAINST(? IN BOOLEAN MODE))) ORDER BY d.endpoint, d.id LIMIT ?;",
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-11', 'hello world', 'hello world', 11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(20), []]);
                await expect(
                    index.getDocuments(
                        { next: { endpoint: 'Endpoint 1', id: 'http://document/aas-21' }, limit: 10 },
                        ['Endpoint 1'],
                        'hello world',
                    ),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(20)),
                    next: null,
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-21',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT d.* FROM documents AS d WHERE d.endpoint IN ('Endpoint 1') AND (d.endpoint > ? OR (d.endpoint = ? AND d.id >= ?)) AND (MATCH(d.idShort, d.id, d.assetId) AGAINST(? IN BOOLEAN MODE) OR EXISTS (SELECT 1 FROM elements AS e WHERE e.uuid = d.uuid AND MATCH(e.id, e.idShort, e.stringValue) AGAINST(? IN BOOLEAN MODE))) ORDER BY d.endpoint, d.id LIMIT ?;",
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-21', 'hello world', 'hello world', 11],
                );
            });

            it('returns the 3 pages backward', async () => {
                connection.query.mockResolvedValue([data.slice(14).reverse(), []]);
                await expect(
                    index.getDocuments({ next: null, limit: 10 }, ['Endpoint 1'], 'hello world'),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(15)),
                    next: null,
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-16',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT d.* FROM documents AS d WHERE d.endpoint IN ('Endpoint 1') AND (MATCH(d.idShort, d.id, d.assetId) AGAINST(? IN BOOLEAN MODE) OR EXISTS (SELECT 1 FROM elements AS e WHERE e.uuid = d.uuid AND MATCH(e.id, e.idShort, e.stringValue) AGAINST(? IN BOOLEAN MODE))) ORDER BY d.endpoint DESC, d.id DESC LIMIT ?;",
                    ['hello world', 'hello world', 11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(4, 15).reverse(), []]);
                await expect(
                    index.getDocuments(
                        {
                            previous: { endpoint: 'Endpoint 1', id: 'http://document/aas-16' },
                            limit: 10,
                        },
                        ['Endpoint 1'],
                        'hello world',
                    ),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(5, 15)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-16',
                    },
                    previous: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-6',
                    },
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT d.* FROM documents AS d WHERE d.endpoint IN ('Endpoint 1') AND (d.endpoint < ? OR (d.endpoint = ? AND d.id < ?)) AND (MATCH(d.idShort, d.id, d.assetId) AGAINST(? IN BOOLEAN MODE) OR EXISTS (SELECT 1 FROM elements AS e WHERE e.uuid = d.uuid AND MATCH(e.id, e.idShort, e.stringValue) AGAINST(? IN BOOLEAN MODE))) ORDER BY d.endpoint DESC, d.id DESC LIMIT ?;",
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-16', 'hello world', 'hello world', 11],
                );

                connection.query.mockReset();
                connection.query.mockResolvedValue([data.slice(0, 5).reverse(), []]);
                await expect(
                    index.getDocuments(
                        {
                            previous: { endpoint: 'Endpoint 1', id: 'http://document/aas-6' },
                            limit: 10,
                        },
                        ['Endpoint 1'],
                        'hello world',
                    ),
                ).resolves.toEqual({
                    documents: toDocuments(data.slice(0, 5)),
                    next: {
                        endpoint: 'Endpoint 1',
                        id: 'http://document/aas-6',
                    },
                    previous: null,
                });

                expect(connection.query).toHaveBeenCalledWith(
                    "SELECT d.* FROM documents AS d WHERE d.endpoint IN ('Endpoint 1') AND (d.endpoint < ? OR (d.endpoint = ? AND d.id < ?)) AND (MATCH(d.idShort, d.id, d.assetId) AGAINST(? IN BOOLEAN MODE) OR EXISTS (SELECT 1 FROM elements AS e WHERE e.uuid = d.uuid AND MATCH(e.id, e.idShort, e.stringValue) AGAINST(? IN BOOLEAN MODE))) ORDER BY d.endpoint DESC, d.id DESC LIMIT ?;",
                    ['Endpoint 1', 'Endpoint 1', 'http://document/aas-6', 'hello world', 'hello world', 11],
                );
            });
        });
    });

    describe('getEndpointDocuments', () => {
        it('selects the first page', async () => {
            const results: MdbDocument[] = [];
            connection.query.mockResolvedValue([results, []]);
            await expect(index.getEndpointDocuments('Endpoint 1', undefined, 10)).resolves.toEqual({
                paging_metadata: { cursor: undefined },
                result: [],
            });

            expect(connection.query).toHaveBeenLastCalledWith(
                'SELECT * FROM documents WHERE endpoint = ? ORDER BY id LIMIT ?;',
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
                        if (query === 'SELECT uuid FROM documents WHERE endpoint = ? AND id = ?;') {
                            return resolve([[{ uuid: '1' } as MdbDocument], []]);
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

        it('commits when the document does not exist', async () => {
            connection.query.mockResolvedValue([[], []]);

            await expect(
                index.update({
                    endpoint: 'Endpoint 1',
                    id: 'http://document/aas',
                    address: 'address',
                    idShort: 'idShort',
                    timestamp: 123,
                } satisfies AASDocument),
            ).resolves.toEqual(void 0);

            expect(connection.commit).toHaveBeenCalledTimes(1);
            expect(connection.rollback).not.toHaveBeenCalled();
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
            const result: MdbDocument = {
                constructor: { name: 'RowDataPacket' },
                uuid: '1',
                id: 'http://document/aas',
                endpoint: 'Endpoint 1',
                address: 'address',
                idShort: 'idShort',
                assetId: 'assetId',
                thumbnail: null,
                timestamp: new Date(123),
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
                        if (query === 'SELECT uuid FROM documents WHERE endpoint = ? AND id = ?;') {
                            return resolve([[{ uuid: '1' } as MdbDocument], []]);
                        }

                        if (query === 'DELETE FROM elements WHERE uuid = ?;') {
                            return resolve([[], []]);
                        }

                        resolve([[], []]);
                    }),
            );

            await expect(index.delete('Endpoint 1', 'http://document/aas')).resolves.toEqual(true);
            expect(connection.beginTransaction).toHaveBeenCalled();
            expect(connection.commit).toHaveBeenCalled();
        });

        it('commits when the document does not exist', async () => {
            connection.query.mockResolvedValue([[], []]);

            await expect(index.delete('Endpoint 1', 'http://document/aas')).resolves.toEqual(false);

            expect(connection.commit).toHaveBeenCalledTimes(1);
            expect(connection.rollback).not.toHaveBeenCalled();
        });
    });

    describe('clear', () => {
        it('clears the index', async () => {
            connection.query.mockResolvedValue([[], []]);
            await expect(index.clear()).resolves.toEqual(void 0);
            expect(connection.beginTransaction).toHaveBeenCalled();
            expect(connection.query).toHaveBeenNthCalledWith(1, 'DELETE FROM elements;');
            expect(connection.query).toHaveBeenNthCalledWith(2, 'DELETE FROM documents;');
            expect(connection.commit).toHaveBeenCalled();
        });

        it('clears all endpoint-scoped index data', async () => {
            const document = { uuid: 'uuid1' } as MdbDocument;
            connection.query.mockImplementation((sql: string | object) => {
                if (sql === 'SELECT uuid FROM documents WHERE endpoint = ?;') {
                    return Promise.resolve([[document], []]);
                }

                return Promise.resolve([[], []]);
            });

            await expect(index.clear('Endpoint 1')).resolves.toEqual(void 0);

            expect(connection.query).toHaveBeenCalledWith('DELETE FROM documents WHERE endpoint = ?;', ['Endpoint 1']);

            expect(connection.query).toHaveBeenCalledWith(
                'DELETE FROM `submodelConceptDescriptions` WHERE endpoint = ?;',
                ['Endpoint 1'],
            );

            expect(connection.query).toHaveBeenCalledWith('DELETE FROM elements WHERE uuid = ?;', ['uuid1']);
        });
    });

    describe('getSubmodelConceptDescriptionIds', () => {
        it('gets the identifiers of the concept descriptions that belongs to a submodel', async () => {
            const result = {
                conceptDescriptionIds: JSON.stringify(['concept-description-1', 'concept-description-2']),
            } as MdbConceptDescriptionIds;

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
            } as MdbConceptDescriptionIds;

            connection.query.mockResolvedValue([[result], []]);
            await index.setSubmodelConceptDescriptionIds('Endpoint 1', 'submodel-1', ['concept-description-2']);
            expect(connection.query).toHaveBeenLastCalledWith(
                'UPDATE `submodelConceptDescriptions` SET conceptDescriptionIds = ? WHERE endpoint = ? AND id = ?;',
                [JSON.stringify(['concept-description-2']), 'Endpoint 1', 'submodel-1'],
            );
        });
    });
});
