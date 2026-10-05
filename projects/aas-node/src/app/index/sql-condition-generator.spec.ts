/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from 'vitest';
import { SqlConditionGenerator } from './sql-condition-generator.js';

describe('SqlConditionGenerator', () => {
    let generator: SqlConditionGenerator;

    describe('generate', () => {
        it('"Hello World"', () => {
            generator = new SqlConditionGenerator('Hello world');
            const values: unknown[] = [];
            expect(generator.generate(values)).toEqual(
                'documents.endpoint REGEXP ? OR documents.id REGEXP ? OR documents.idShort REGEXP ? OR elements.idShort REGEXP ? OR elements.id REGEXP ? OR elements.stringValue REGEXP ?',
            );

            expect(values).toEqual([
                'Hello|world',
                'Hello|world',
                'Hello|world',
                'Hello|world',
                'Hello|world',
                'Hello|world',
            ]);
        });
    });
});
