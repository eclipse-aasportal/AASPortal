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
        it('creates regular-expression conditions for text searches', () => {
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

        it('creates string conditions with optional model type and idShort filters', () => {
            generator = new SqlConditionGenerator('#prop:name="John Doe" && #prop:manufacturer != Acme');
            const values: unknown[] = [];

            expect(generator.generate(values)).toBe(
                "elements.modelType = 'prop' AND elements.idShort LIKE ? AND elements.stringValue LIKE ? AND elements.modelType = 'prop' AND elements.idShort LIKE ? AND elements.stringValue NOT LIKE ?",
            );
            expect(values).toEqual(['%name%', '%John Doe%', '%manufacturer%', '%Acme%']);
        });

        it('creates numeric and bigint scalar and range conditions', () => {
            generator = new SqlConditionGenerator(
                '#prop:temperature>=42 && #prop:range=-5 ... 5 && #prop:serial<123n && #prop:batch=1n ... 9n',
            );
            const values: unknown[] = [];

            expect(generator.generate(values)).toBe(
                "elements.modelType = 'prop' AND elements.idShort LIKE ? AND elements.numberValue >= ? AND elements.modelType = 'prop' AND elements.idShort LIKE ? AND elements.numberValue >= ? AND elements.numberValue <= ? AND elements.modelType = 'prop' AND elements.idShort LIKE ? AND elements.bigintValue < ? AND elements.modelType = 'prop' AND elements.idShort LIKE ? AND elements.bigintValue >= ? AND elements.bigintValue <= ?",
            );
            expect(values).toEqual(['%temperature%', 42, '%range%', -5, 5, '%serial%', 123n, '%batch%', 1n, 9n]);
        });

        it('creates date scalar and range conditions', () => {
            generator = new SqlConditionGenerator('#prop:created<=12/31/2023 && #prop:period=1/1/2023 ... 12/31/2023');
            const values: unknown[] = [];

            expect(generator.generate(values)).toBe(
                "elements.modelType = 'prop' AND elements.idShort LIKE ? AND elements.dateValue <= ? AND elements.modelType = 'prop' AND elements.idShort LIKE ? AND elements.dateValue >= ? AND elements.dateValue <= ?",
            );
            expect(values).toEqual([
                '%created%',
                new Date(2023, 11, 31),
                '%period%',
                new Date(2023, 0, 1),
                new Date(2023, 11, 31),
            ]);
        });

        it('creates boolean equality and inequality conditions', () => {
            generator = new SqlConditionGenerator('#prop:active=true || #prop:disabled!=true');
            const values: unknown[] = [];

            expect(generator.generate(values)).toBe(
                "elements.modelType = 'prop' AND elements.idShort LIKE ? AND elements.booleanValue ? <> 0 OR elements.modelType = 'prop' AND elements.idShort LIKE ? AND elements.booleanValue ? = 0",
            );
            expect(values).toEqual(['%active%', true, '%disabled%', true]);
        });

        it('preserves grouping for nested OR conditions', () => {
            generator = new SqlConditionGenerator('#prop:name=primary && (#prop:rank=1 || #prop:rank>2)');
            const values: unknown[] = [];

            expect(generator.generate(values)).toBe(
                "elements.modelType = 'prop' AND elements.idShort LIKE ? AND elements.stringValue LIKE ? AND (elements.modelType = 'prop' AND elements.idShort LIKE ? AND elements.numberValue = ? OR elements.modelType = 'prop' AND elements.idShort LIKE ? AND elements.numberValue > ?)",
            );
            expect(values).toEqual(['%name%', '%primary%', '%rank%', 1, '%rank%', 2]);
        });

        it('creates a model type condition without optional filters', () => {
            generator = new SqlConditionGenerator('#prop');
            const values: unknown[] = [];

            expect(generator.generate(values)).toBe("elements.modelType = 'prop'");
            expect(values).toEqual([]);
        });
    });
});
