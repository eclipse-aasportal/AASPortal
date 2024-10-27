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
import { MySqlIndex } from '../../../app/aas-index/mysql/mysql-index.js';
import { Logger } from '../../../app/logging/logger.js';
import { Variable } from '../../../app/variable.js';
import { KeywordDirectory } from '../../../app/aas-index/keyword-directory.js';
import { DocumentCount } from '../../../app/aas-index/mysql/mysql-types.js';

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
        connection = createSpyObj<Connection>(['query']);
        index = new MySqlIndex(logger, variable, keywords, connection);
    });

    it('should be created', () => {
        expect(index).toBeTruthy();
    });

    describe('getCount', () => {
        it('returns the total number of documents', async () => {
            const result: DocumentCount = {
                constructor: { name: 'RowDataPacket' },
                count: 42,
            };

            connection.query.mockResolvedValue([[result], []]);
            const count = await index.getCount();
            expect(connection.query).toBeCalledWith('SELECT COUNT(*) FROM `documents` AS count');
            expect(count).toEqual(42);
        });

        it('returns the total number of documents of the specified Endpoint', async () => {
            const result: DocumentCount = {
                constructor: { name: 'RowDataPacket' },
                count: 42,
            };

            connection.query.mockResolvedValue([[result], []]);
            const count = await index.getCount('Samples');
            expect(connection.query).toBeCalledWith('SELECT COUNT(*) FROM `documents` WHERE endpoint = ? AS count', [
                'Samples',
            ]);

            expect(count).toEqual(42);
        });
    });
});
