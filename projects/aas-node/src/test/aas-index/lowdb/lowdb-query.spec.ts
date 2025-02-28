/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, beforeAll } from '@jest/globals';
import path from 'path/posix';
import fs from 'fs';
import { LowDbQuery } from '../../../app/aas-index/lowdb/lowdb-query.js';
import { LowDbData, LowDbDocument, LowDbElement } from '../../../app/aas-index/lowdb/lowdb-types.js';

describe('LowDbQuery', () => {
    let query: LowDbQuery;
    let document: LowDbDocument;
    let elements: LowDbElement[];
    let dbData: LowDbData;

    describe('text search', () => {
        beforeAll(async () => {
            const file = path.resolve('./', 'src/test/assets/test-db.json');
            dbData = JSON.parse((await fs.promises.readFile(file)).toString());
        });

        beforeEach(async () => {
            document = dbData.documents.find(document => document.idShort === 'ExampleMotor')!;
            elements = dbData.elements;
        });

        it('returns false for "unknown"', () => {
            query = new LowDbQuery('unknown', 'en');
            expect(query.do(document, elements)).toBeFalsy();
        });

        it('returns true for "EXAMPLEmotor"', () => {
            query = new LowDbQuery('EXAMPLEmotor', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });

        it('returns true for "unknown || motor"', () => {
            query = new LowDbQuery('unknown || motor', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });

        it('returns false for "unknown && motor"', () => {
            query = new LowDbQuery('unknown && motor', 'en');
            expect(query.do(document, elements)).toBeFalsy();
        });

        it('returns true for "EXAMPLE && motor"', () => {
            query = new LowDbQuery('EXAMPLE && motor', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });

        it('returns  result for "unknown && 42 || example && mOTOR"', () => {
            query = new LowDbQuery('unknown && 42 || example && mOTOR', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });
    });

    describe('AAS element search', () => {
        beforeEach(() => {
            document = dbData.documents[0];
            elements = dbData.elements;
        });

        it('returns true for "#prop:MaxRotationSpeed"', () => {
            query = new LowDbQuery('#prop:MaxRotationSpeed', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed=5000"', () => {
            query = new LowDbQuery('#prop:MaxRotationSpeed=5000', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed >= 4000"', () => {
            query = new LowDbQuery('#prop:MaxRotationSpeed >= 4000', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed >= 5000"', () => {
            query = new LowDbQuery('#prop:MaxRotationSpeed >= 5000', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed > 4999"', () => {
            query = new LowDbQuery('#prop:MaxRotationSpeed > 4999', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });

        it('returns false for "#prop:MaxRotationSpeed > 5000"', () => {
            query = new LowDbQuery('#prop:MaxRotationSpeed > 5000', 'en');
            expect(query.do(document, elements)).toBeFalsy();
        });

        it('returns true for "#prop:MaxRotationSpeed <= 5000"', () => {
            query = new LowDbQuery('#prop:MaxRotationSpeed <= 5000', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed < 5001"', () => {
            query = new LowDbQuery('#prop:MaxRotationSpeed < 5001', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });

        it('returns false for "#prop:MaxRotationSpeed < 5000"', () => {
            query = new LowDbQuery('#prop:MaxRotationSpeed < 5000', 'en');
            expect(query.do(document, elements)).toBeFalsy();
        });

        it('returns true for "#prop:MaxRotationSpeed = 4999...5001"', () => {
            query = new LowDbQuery('#prop:MaxRotationSpeed = 4999...5001', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });

        it('returns false for "#prop:MaxRotationSpeed != 5000"', () => {
            query = new LowDbQuery('#prop:MaxRotationSpeed != 5000', 'en');
            expect(query.do(document, elements)).toBeFalsy();
        });

        it('returns true for "#prop:MaxRotationSpeed != 4999"', () => {
            query = new LowDbQuery('#prop:MaxRotationSpeed != 4999', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });

        it('returns 1 result for "#prop=5000"', () => {
            query = new LowDbQuery('#prop=5000', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });

        it('returns n results for "#prop"', () => {
            query = new LowDbQuery('#prop', 'en');
            expect(query.do(document, elements)).toBeTruthy();
        });
    });
});