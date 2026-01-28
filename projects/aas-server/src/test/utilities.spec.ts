/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { types } from 'aas-core';
import { serializeValue, toValueSerialization } from '../app/utilities.js';
import {
    mockAnnotatedRelationshipElement,
    mockBasicEventElement,
    mockBlob,
    mockEntity,
    mockFile,
    mockMultiLanguageProperty,
    mockProperty,
    mockRange,
    mockReference,
    mockReferenceElement,
    mockRelationshipElement,
    mockSubmodelElementCollection,
    mockSubmodelElementList,
} from './mocks.js';

describe('utilities', () => {
    describe('toValueSerialization', () => {
        it('serializes Property', () => {
            const prop = mockProperty('42', 'xs:int');
            expect(toValueSerialization(prop)).toBe(42);
        });

        it('serializes File', () => {
            const file = mockFile('text/plain', 'file.txt');
            expect(toValueSerialization(file)).toEqual({ contentType: 'text/plain', value: 'file.txt' });
        });

        it('serializes MultiLanguageProperty', () => {
            const mlp = mockMultiLanguageProperty([{ language: 'bar', text: 'foo' }]);
            expect(toValueSerialization(mlp)).toEqual([{ language: 'bar', text: 'foo' }]);
        });

        it('serializes Blob', () => {
            const blob = mockBlob('application/octet-stream', 'deadbeef');
            expect(toValueSerialization(blob)).toEqual({ contentType: 'application/octet-stream', value: 'deadbeef' });
        });

        it('serializes Range', () => {
            const range = mockRange('1', '10', 'xs:int');
            expect(toValueSerialization(range)).toEqual({ min: 1, max: 10 });
        });

        it('serializes ReferenceElement', () => {
            const ref = mockReference('ModelReference', [{ type: 'Submodel', value: 'foo' }]);
            const refElem = mockReferenceElement(ref);
            expect(toValueSerialization(refElem)).toEqual({
                type: 'ModelReference',
                keys: [{ type: 'Submodel', value: 'foo' }],
            });
        });

        it('serializes RelationshipElement', () => {
            const first = mockReference('ModelReference', [{ type: 'Submodel', value: 'foo' }]);
            const second = mockReference('ModelReference', [{ type: 'Submodel', value: 'bar' }]);
            const relElem = mockRelationshipElement(first, second);
            expect(toValueSerialization(relElem)).toEqual({
                first: { type: 'ModelReference', keys: [{ type: 'Submodel', value: 'foo' }] },
                second: { type: 'ModelReference', keys: [{ type: 'Submodel', value: 'bar' }] },
            });
        });

        it('serializes BasicEventElement', () => {
            const observed = mockReference('ModelReference', [{ type: 'Submodel', value: 'foo' }]);
            const eventElem = mockBasicEventElement(observed);
            expect(toValueSerialization(eventElem)).toEqual({
                observed: { type: 'ModelReference', keys: [{ type: 'Submodel', value: 'foo' }] },
            });
        });

        it('serializes SubmodelElementCollection', () => {
            const child1 = mockProperty('1', 'xs:int');
            child1.idShort = 'foo';
            const child2 = mockProperty('2', 'xs:int');
            child2.idShort = 'bar';
            const collection = mockSubmodelElementCollection([child1, child2]);
            expect(toValueSerialization(collection)).toEqual({ foo: 1, bar: 2 });
        });

        it('serializes SubmodelElementList', () => {
            const child1 = mockProperty('1', 'xs:int');
            const child2 = mockProperty('2', 'xs:int');
            const list = mockSubmodelElementList([child1, child2]);
            expect(toValueSerialization(list)).toEqual([1, 2]);
        });

        it('serializes Entity', () => {
            const stmt1 = mockProperty('1', 'xs:int');
            stmt1.idShort = 'foo';
            const stmt2 = mockProperty('2', 'xs:int');
            stmt2.idShort = 'bar';
            const entity = mockEntity('CoManagedEntity', 'asset-123', [stmt1, stmt2]);
            expect(toValueSerialization(entity)).toEqual({
                entityType: 'CoManagedEntity',
                globalAssetId: 'asset-123',
                statements: { foo: 1, bar: 2 },
            });
        });

        it('serializes AnnotatedRelationshipElement', () => {
            const first = mockReference('ModelReference', [{ type: 'Submodel', value: 'foo' }]);
            const second = mockReference('ModelReference', [{ type: 'Submodel', value: 'bar' }]);
            const ann1 = mockProperty('1', 'xs:int');
            ann1.idShort = 'a1';
            const ann2 = mockProperty('2', 'xs:int');
            ann2.idShort = 'a2';
            const annotated = mockAnnotatedRelationshipElement(first, second, [ann1, ann2]);
            expect(toValueSerialization(annotated)).toEqual({
                first: { type: 'ModelReference', keys: [{ type: 'Submodel', value: 'foo' }] },
                second: { type: 'ModelReference', keys: [{ type: 'Submodel', value: 'bar' }] },
                annotations: { a1: 1, a2: 2 },
            });
        });
    });

    describe('serializeValue', () => {
        it('returns empty string for null or undefined', () => {
            expect(serializeValue(null, types.DataTypeDefXsd.String)).toBeNull();
            expect(serializeValue(undefined, types.DataTypeDefXsd.String)).toBeNull();
        });

        it('serializes boolean values', () => {
            expect(serializeValue(true, types.DataTypeDefXsd.Boolean)).toBe('true');
            expect(serializeValue(false, types.DataTypeDefXsd.Boolean)).toBe('false');
        });

        it('serializes number values', () => {
            expect(serializeValue(42, types.DataTypeDefXsd.Int)).toBe('42');
            expect(serializeValue(3.14, types.DataTypeDefXsd.Double)).toBe('3.14');
            expect(serializeValue(-1, types.DataTypeDefXsd.Short)).toBe('-1');
        });

        it('serializes string values as is for non-date types', () => {
            expect(serializeValue('Hello', types.DataTypeDefXsd.String)).toBe('Hello');
            expect(serializeValue(42, types.DataTypeDefXsd.Int)).toBe('42');
        });

        it('serializes string values as ISO string for date types', () => {
            expect(serializeValue('2000-01-01T14:23:00', types.DataTypeDefXsd.DateTime)).toBe('2000-01-01T14:23:00');
            expect(serializeValue('14:23:00.527634Z', types.DataTypeDefXsd.Time)).toBe('14:23:00.527634Z');
            expect(serializeValue('2000-01-01+12:05', types.DataTypeDefXsd.Date)).toBe('2000-01-01+12:05');
        });

        it('serializes string values as is if not a valid date for date types', () => {
            expect(serializeValue('not-a-date', types.DataTypeDefXsd.DateTime)).toBe('not-a-date');
        });

        it('serializes string values as ISO string for xs:date', () => {
            const date = new Date(2023, 1, 27);
            expect(serializeValue(date.toISOString(), types.DataTypeDefXsd.Date)).toBe(date.toISOString());
        });

        it('serializes string values as ISO string for xs:time', () => {
            const date = new Date(2023, 1, 27, 13, 14, 15);
            expect(serializeValue(date.toISOString(), types.DataTypeDefXsd.Time)).toBe(date.toISOString());
        });
    });
});
