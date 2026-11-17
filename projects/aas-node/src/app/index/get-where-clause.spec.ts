/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from 'vitest';
import { getWhereClause } from './get-where-clause.js';
import { FilterExpressionParser } from 'aas-core';

describe('getWhereClause', () => {
    describe('generate', () => {
        it('creates string conditions with optional model type and idShort filters', () => {
            const clause = new FilterExpressionParser('#prop:name="John Doe" && #prop:manufacturer != Acme').clause;
            const values: unknown[] = [];

            expect(getWhereClause(clause, values)).toBe(
                "EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (e.modelType = 'prop' AND e.idShort LIKE ? AND e.stringValue LIKE ? AND e.modelType = 'prop' AND e.idShort LIKE ? AND e.stringValue NOT LIKE ?))",
            );

            expect(values).toEqual(['%name%', '%John Doe%', '%manufacturer%', '%Acme%']);
        });

        it('creates numeric and bigint scalar and range conditions', () => {
            const clause = new FilterExpressionParser(
                '#prop:temperature>=42 && #prop:range=-5 ... 5 && #prop:serial<123n && #prop:batch=1n ... 9n',
            ).clause;

            const values: unknown[] = [];

            expect(getWhereClause(clause, values)).toBe(
                "EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (e.modelType = 'prop' AND e.idShort LIKE ? AND e.numberValue >= ? AND e.modelType = 'prop' AND e.idShort LIKE ? AND e.numberValue >= ? AND e.numberValue <= ? AND e.modelType = 'prop' AND e.idShort LIKE ? AND e.bigintValue < ? AND e.modelType = 'prop' AND e.idShort LIKE ? AND e.bigintValue >= ? AND e.bigintValue <= ?))",
            );

            expect(values).toEqual(['%temperature%', 42, '%range%', -5, 5, '%serial%', 123n, '%batch%', 1n, 9n]);
        });

        it('creates date scalar and range conditions', () => {
            const clause = new FilterExpressionParser(
                '#prop:created<=12/31/2023 && #prop:period=1/1/2023 ... 12/31/2023',
            ).clause;

            const values: unknown[] = [];

            expect(getWhereClause(clause, values)).toBe(
                "EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (e.modelType = 'prop' AND e.idShort LIKE ? AND e.dateValue <= ? AND e.modelType = 'prop' AND e.idShort LIKE ? AND e.dateValue >= ? AND e.dateValue <= ?))",
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
            const clause = new FilterExpressionParser('#prop:active=true || #prop:disabled!=true').clause;
            const values: unknown[] = [];

            expect(getWhereClause(clause, values)).toBe(
                "EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (e.modelType = 'prop' AND e.idShort LIKE ? AND e.booleanValue ? <> 0 OR e.modelType = 'prop' AND e.idShort LIKE ? AND e.booleanValue ? = 0))",
            );
            expect(values).toEqual(['%active%', true, '%disabled%', true]);
        });

        it('preserves grouping for nested OR conditions', () => {
            const clause = new FilterExpressionParser('#prop:name=primary && (#prop:rank=1 || #prop:rank>2)').clause;
            const values: unknown[] = [];

            expect(getWhereClause(clause, values)).toBe(
                "EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (e.modelType = 'prop' AND e.idShort LIKE ? AND e.stringValue LIKE ? AND (EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (e.modelType = 'prop' AND e.idShort LIKE ? AND e.numberValue = ? OR e.modelType = 'prop' AND e.idShort LIKE ? AND e.numberValue > ?)))))",
            );

            expect(values).toEqual(['%name%', '%primary%', '%rank%', 1, '%rank%', 2]);
        });

        it('creates a model type condition without optional filters', () => {
            const clause = new FilterExpressionParser('#prop').clause;
            const values: unknown[] = [];

            expect(getWhereClause(clause, values)).toBe(
                "EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (e.modelType = 'prop'))",
            );

            expect(values).toEqual([]);
        });
    });
});
