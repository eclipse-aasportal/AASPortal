/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, jest, beforeAll } from '@jest/globals';
import path from 'path';
import fs from 'fs';
import { LowDbQuery } from '../../../app/aas-provider/lowdb/lowdb-query.js';
import { LowDbData, LowDbDocument, LowDbElement } from '../../../app/aas-provider/lowdb/lowdb-types.js';

describe('LowDbQuery', () => {
    let filter: LowDbQuery;
    let document: LowDbDocument;
    let elements: LowDbElement[];
    let dbData: LowDbData;

    describe('full text search', () => {
        beforeAll(async () => {
            const file = path.resolve('./', 'src/test/assets/test-db.json');
            dbData = JSON.parse((await fs.promises.readFile(file)).toString());
        });

        beforeEach(async () => {
            document = dbData.documents.find(document => document.idShort === 'ExampleMotor')!;
            elements = dbData.elements;
        });

        it('returns false for "unknown"', () => {
            filter = new LowDbQuery('unknown', 'en');
            expect(filter.do(document, elements)).toBeFalsy();
        });

        it('returns true for "EXAMPLEmotor"', () => {
            filter = new LowDbQuery('EXAMPLEmotor', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });

        it('returns true for "unknown || motor"', () => {
            filter = new LowDbQuery('unknown || motor', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });

        it('returns false for "unknown && motor"', () => {
            filter = new LowDbQuery('unknown && motor', 'en');
            expect(filter.do(document, elements)).toBeFalsy();
        });

        it('returns true for "EXAMPLE && motor"', () => {
            filter = new LowDbQuery('EXAMPLE && motor', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });

        it('returns  result for "unknown && 42 || example && mOTOR"', () => {
            filter = new LowDbQuery('unknown && 42 || example && mOTOR', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });
    });

    describe('pattern search', () => {
        beforeEach(() => {
            document = dbData.documents[0];
            elements = dbData.elements;
        });

        it('returns true for "#prop:MaxRotationSpeed"', () => {
            filter = new LowDbQuery('#prop:MaxRotationSpeed', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed=5000"', () => {
            filter = new LowDbQuery('#prop:MaxRotationSpeed=5000', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed >= 4000"', () => {
            filter = new LowDbQuery('#prop:MaxRotationSpeed >= 4000', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed >= 5000"', () => {
            filter = new LowDbQuery('#prop:MaxRotationSpeed >= 5000', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed > 4999"', () => {
            filter = new LowDbQuery('#prop:MaxRotationSpeed > 4999', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });

        it('returns false for "#prop:MaxRotationSpeed > 5000"', () => {
            filter = new LowDbQuery('#prop:MaxRotationSpeed > 5000', 'en');
            expect(filter.do(document, elements)).toBeFalsy();
        });

        it('returns true for "#prop:MaxRotationSpeed <= 5000"', () => {
            filter = new LowDbQuery('#prop:MaxRotationSpeed <= 5000', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed < 5001"', () => {
            filter = new LowDbQuery('#prop:MaxRotationSpeed < 5001', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });

        it('returns false for "#prop:MaxRotationSpeed < 5000"', () => {
            filter = new LowDbQuery('#prop:MaxRotationSpeed < 5000', 'en');
            expect(filter.do(document, elements)).toBeFalsy();
        });

        it('returns true for "#prop:MaxRotationSpeed = 4999...5001"', () => {
            filter = new LowDbQuery('#prop:MaxRotationSpeed = 4999...5001', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });

        it('returns false for "#prop:MaxRotationSpeed != 5000"', () => {
            filter = new LowDbQuery('#prop:MaxRotationSpeed != 5000', 'en');
            expect(filter.do(document, elements)).toBeFalsy();
        });

        it('returns true for "#prop:MaxRotationSpeed != 4999"', () => {
            filter = new LowDbQuery('#prop:MaxRotationSpeed != 4999', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });

        it('returns 1 result for "#prop=5000"', () => {
            filter = new LowDbQuery('#prop=5000', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });

        it('returns n results for "#prop"', () => {
            filter = new LowDbQuery('#prop', 'en');
            expect(filter.do(document, elements)).toBeTruthy();
        });
    });
});