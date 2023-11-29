/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { AASDocument } from 'common';
import { LowDbQuery } from '../../app/aas-provider/lowdb/lowdb-query.js';
import { sampleDocument } from '../assets/sample-document.js';

describe('AASTableFilter', function () {
    let filter: LowDbQuery;
    let input: AASDocument;

    describe('full text search', function () {
        beforeEach(function () {
            input = sampleDocument;
        });

        it('returns false for "unknown"', function () {
            filter = new LowDbQuery('unknown', 'en');
            expect(filter.do(input)).toBeFalsy();
        });

        it('returns true for "EXAMPLEmotor"', function () {
            filter = new LowDbQuery('EXAMPLEmotor', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns true for "unknown || motor"', function () {
            filter = new LowDbQuery('unknown || motor', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns false for "unknown && motor"', function () {
            filter = new LowDbQuery('unknown && motor', 'en');
            expect(filter.do(input)).toBeFalsy();
        });

        it('returns true for "EXAMPLE && motor"', function () {
            filter = new LowDbQuery('EXAMPLE && motor', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns  result for "unknown && 42 || example && mOTOR"', function () {
            filter = new LowDbQuery('unknown && 42 || example && mOTOR', 'en');
            expect(filter.do(input)).toBeTruthy();
        });
    });

    describe('pattern search', function () {
        beforeEach(function () {
            input = sampleDocument;
        });

        it('returns true for "#prop:MaxRotationSpeed"', function () {
            filter = new LowDbQuery('#prop:MaxRotationSpeed', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed=5000"', function () {
            filter = new LowDbQuery('#prop:MaxRotationSpeed=5000', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed >= 4000"', function () {
            filter = new LowDbQuery('#prop:MaxRotationSpeed >= 4000', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed >= 5000"', function () {
            filter = new LowDbQuery('#prop:MaxRotationSpeed >= 5000', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed > 4999"', function () {
            filter = new LowDbQuery('#prop:MaxRotationSpeed > 4999', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns false for "#prop:MaxRotationSpeed > 5000"', function () {
            filter = new LowDbQuery('#prop:MaxRotationSpeed > 5000', 'en');
            expect(filter.do(input)).toBeFalsy();
        });

        it('returns true for "#prop:MaxRotationSpeed <= 5000"', function () {
            filter = new LowDbQuery('#prop:MaxRotationSpeed <= 5000', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed < 5001"', function () {
            filter = new LowDbQuery('#prop:MaxRotationSpeed < 5001', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns false for "#prop:MaxRotationSpeed < 5000"', function () {
            filter = new LowDbQuery('#prop:MaxRotationSpeed < 5000', 'en');
            expect(filter.do(input)).toBeFalsy();
        });

        it('returns true for "#prop:MaxRotationSpeed = 4999...5001"', function () {
            filter = new LowDbQuery('#prop:MaxRotationSpeed = 4999...5001', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns false for "#prop:MaxRotationSpeed != 5000"', function () {
            filter = new LowDbQuery('#prop:MaxRotationSpeed != 5000', 'en');
            expect(filter.do(input)).toBeFalsy();
        });

        it('returns true for "#prop:MaxRotationSpeed != 4999"', function () {
            filter = new LowDbQuery('#prop:MaxRotationSpeed != 4999', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns 1 result for "#prop=5000"', function () {
            filter = new LowDbQuery('#prop=5000', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns n results for "#prop"', function () {
            filter = new LowDbQuery('#prop', 'en');
            expect(filter.do(input)).toBeTruthy();
        });
    });
});