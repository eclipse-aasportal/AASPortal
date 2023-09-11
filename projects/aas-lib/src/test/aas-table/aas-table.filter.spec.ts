/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateService } from '@ngx-translate/core';
import { AASTableFilter } from 'src/lib/aas-table/aas-table.filter';
import { AASTableRow } from 'src/lib/aas-table/aas-table.state';
import { aasNoTechnicalData, sampleDocument } from '../assets/sample-document'

describe('AASTableFilter', function () {
    let filter: AASTableFilter;
    let translate: jasmine.SpyObj<TranslateService>;
    let input: AASTableRow[];

    beforeEach(function () {
        translate = jasmine.createSpyObj<TranslateService>('TranslateService', {}, { currentLang: 'en-us' });
        filter = new AASTableFilter(translate);
    });

    describe('full text search', function () {
        beforeEach(function () {
            input = [
                new AASTableRow(sampleDocument, false, 'name1', '111', 'file', false, false, 0, -1, -1),
                new AASTableRow(sampleDocument, false, 'name2', '222', 'file', false, false, 0, -1, -1),
                new AASTableRow(sampleDocument, false, 'name3', '333', 'file', false, false, 0, -1, -1),
                new AASTableRow(sampleDocument, false, 'name41', '444', 'file', false, false, 0, -1, -1),
                new AASTableRow(sampleDocument, false, 'name42', '555', 'file', false, false, 0, -1, -1),
                new AASTableRow(sampleDocument, false, 'name43', '666', 'file', false, false, 0, -1, -1)
            ];
        });

        it('returns no result for "999"', function () {
            expect(filter.do(input, '999')).toEqual([]);
        });

        it('returns 1 result for "111"', function () {
            expect(filter.do(input, '111')).toEqual([input[0]]);
        });

        it('returns 3 result for "name4"', function () {
            expect(filter.do(input, 'name4')).toEqual([input[3], input[4], input[5]]);
        });

        it('returns all for "NaMe"', function () {
            expect(filter.do(input, 'NaMe')).toEqual(input);
        });

        it('returns 2 result for "111 || name2"', function () {
            expect(filter.do(input, '111 || name2')).toEqual([input[0], input[1]]);
        });

        it('returns 1 result for "111 && name1"', function () {
            expect(filter.do(input, '111 && name1')).toEqual([input[0]]);
        });

        it('returns 1 result for "name4 && 444"', function () {
            expect(filter.do(input, 'name4 && 444')).toEqual([input[3]]);
        });

        it('returns 1 result for "name1 && 111 || name2 && 222"', function () {
            expect(filter.do(input, 'name1 && 111 || name4 && 666')).toEqual([input[0], input[5]]);
        });
    });

    describe('pattern search', function () {
        beforeEach(function () {
            input = [
                new AASTableRow(sampleDocument, false, 'name1', '111', 'file', false, false, 0, -1, -1),
                new AASTableRow(aasNoTechnicalData, false, 'name2', '222', 'file', false, false, 0, -1, -1),
            ];
        });

        it('returns 1 result for "#prop:MaxRotationSpeed"', function () {
            expect(filter.do(input, '#prop:MaxRotationSpeed')).toEqual([input[0]]);
        });

        it('returns 1 result for "#prop:MaxRotationSpeed=5000"', function () {
            expect(filter.do(input, '#prop:MaxRotationSpeed=5000')).toEqual([input[0]]);
        });

        it('returns 1 result for "#prop:MaxRotationSpeed >= 4000"', function () {
            expect(filter.do(input, '#prop:MaxRotationSpeed >= 4000')).toEqual([input[0]]);
        });

        it('returns 0 result for "#prop:MaxRotationSpeed >= 5000"', function () {
            expect(filter.do(input, '#prop:MaxRotationSpeed >= 5000')).toEqual([input[0]]);
        });

        it('returns 1 result for "#prop:MaxRotationSpeed > 4999"', function () {
            expect(filter.do(input, '#prop:MaxRotationSpeed > 4999')).toEqual([input[0]]);
        });

        it('returns no result for "#prop:MaxRotationSpeed > 5000"', function () {
            expect(filter.do(input, '#prop:MaxRotationSpeed > 5000')).toEqual([]);
        });

        it('returns 1 result for "#prop:MaxRotationSpeed <= 5000"', function () {
            expect(filter.do(input, '#prop:MaxRotationSpeed <= 5000')).toEqual([input[0]]);
        });

        it('returns 0 result for "#prop:MaxRotationSpeed < 5001"', function () {
            expect(filter.do(input, '#prop:MaxRotationSpeed < 5001')).toEqual([input[0]]);
        });

        it('returns 0 result for "#prop:MaxRotationSpeed < 5000"', function () {
            expect(filter.do(input, '#prop:MaxRotationSpeed < 5000')).toEqual([]);
        });

        it('returns 0 result for "#prop:MaxRotationSpeed = 4999...5001"', function () {
            expect(filter.do(input, '#prop:MaxRotationSpeed = 4999...5001')).toEqual([input[0]]);
        });

        it('returns 0 result for "#prop:MaxRotationSpeed != 5000"', function () {
            expect(filter.do(input, '#prop:MaxRotationSpeed != 5000')).toEqual([]);
        });

        it('returns 0 result for "#prop:MaxRotationSpeed != 4999"', function () {
            expect(filter.do(input, '#prop:MaxRotationSpeed != 4999')).toEqual([input[0]]);
        });

        it('returns 1 result for "#prop=5000"', function () {
            expect(filter.do(input, '#prop=5000')).toEqual([input[0]]);
        });

        it('returns n results for "#prop"', function () {
            expect(filter.do(input, '#prop').length > 0).toBeTrue();
        });
    });
});