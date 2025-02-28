/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from '@jest/globals';
import { MySqlQuery } from '../../../app/aas-index/mysql/mysql-query.js';

describe('MySqlQuery', () => {
    describe('createSql', () => {
        it('"Hello World"', () => {
            const query = new MySqlQuery('"Hello World"');
            const values: unknown[] = [];
            expect(query.createSql(values)).toEqual(
                "(documents.endpoint LIKE '%Hello World%' OR documents.id LIKE '%Hello World%' OR documents.idShort LIKE '%Hello World%')",
            );
        });

        it('A && (B || C)', () => {
            const a = `documents.endpoint LIKE '%A%' OR documents.id LIKE '%A%' OR documents.idShort LIKE '%A%'`;
            const b = `documents.endpoint LIKE '%B%' OR documents.id LIKE '%B%' OR documents.idShort LIKE '%B%'`;
            const c = `documents.endpoint LIKE '%C%' OR documents.id LIKE '%C%' OR documents.idShort LIKE '%C%'`;
            const query = new MySqlQuery('A && (B || C)');
            expect(query.createSql([])).toEqual(`(${a}) AND ((${b}) OR (${c}))`);
        });
    });
});