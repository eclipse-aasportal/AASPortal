/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { AASDocument } from 'common';
import { AASFilter } from '../../app/aas-provider/aas-filter.js';
import { sampleDocument } from '../assets/sample-document.js';

describe('AASTableFilter', function () {
    let filter: AASFilter;
    let input: AASDocument;

    describe('full text search', function () {
        beforeEach(function () {
            input = sampleDocument;
        });

        it('returns false for "unknown"', function () {
            filter = new AASFilter('unknown', 'en');
            expect(filter.do(input)).toBeFalsy();
        });

        it('returns true for "EXAMPLEmotor"', function () {
            filter = new AASFilter('EXAMPLEmotor', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns true for "unknown || motor"', function () {
            filter = new AASFilter('unknown || motor', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns false for "unknown && motor"', function () {
            filter = new AASFilter('unknown && motor', 'en');
            expect(filter.do(input)).toBeFalsy();
        });

        it('returns true for "EXAMPLE && motor"', function () {
            filter = new AASFilter('EXAMPLE && motor', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns  result for "unknown && 42 || example && mOTOR"', function () {
            filter = new AASFilter('unknown && 42 || example && mOTOR', 'en');
            expect(filter.do(input)).toBeTruthy();
        });
    });

    describe('pattern search', function () {
        beforeEach(function () {
            input = sampleDocument;
        });

        it('returns true for "#prop:MaxRotationSpeed"', function () {
            filter = new AASFilter('#prop:MaxRotationSpeed', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed=5000"', function () {
            filter = new AASFilter('#prop:MaxRotationSpeed=5000', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed >= 4000"', function () {
            filter = new AASFilter('#prop:MaxRotationSpeed >= 4000', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed >= 5000"', function () {
            filter = new AASFilter('#prop:MaxRotationSpeed >= 5000', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed > 4999"', function () {
            filter = new AASFilter('#prop:MaxRotationSpeed > 4999', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns false for "#prop:MaxRotationSpeed > 5000"', function () {
            filter = new AASFilter('#prop:MaxRotationSpeed > 5000', 'en');
            expect(filter.do(input)).toBeFalsy();
        });

        it('returns true for "#prop:MaxRotationSpeed <= 5000"', function () {
            filter = new AASFilter('#prop:MaxRotationSpeed <= 5000', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns true for "#prop:MaxRotationSpeed < 5001"', function () {
            filter = new AASFilter('#prop:MaxRotationSpeed < 5001', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns false for "#prop:MaxRotationSpeed < 5000"', function () {
            filter = new AASFilter('#prop:MaxRotationSpeed < 5000', 'en');
            expect(filter.do(input)).toBeFalsy();
        });

        it('returns true for "#prop:MaxRotationSpeed = 4999...5001"', function () {
            filter = new AASFilter('#prop:MaxRotationSpeed = 4999...5001', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns false for "#prop:MaxRotationSpeed != 5000"', function () {
            filter = new AASFilter('#prop:MaxRotationSpeed != 5000', 'en');
            expect(filter.do(input)).toBeFalsy();
        });

        it('returns true for "#prop:MaxRotationSpeed != 4999"', function () {
            filter = new AASFilter('#prop:MaxRotationSpeed != 4999', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns 1 result for "#prop=5000"', function () {
            filter = new AASFilter('#prop=5000', 'en');
            expect(filter.do(input)).toBeTruthy();
        });

        it('returns n results for "#prop"', function () {
            filter = new AASFilter('#prop', 'en');
            expect(filter.do(input)).toBeTruthy();
        });
    });
});