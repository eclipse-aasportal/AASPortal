/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect } from 'vitest';
import { JsonWriterV3 } from './json-writer-v3.js';

import { aasEnvironment } from '../../test/assets/aas-environment.js';

describe('JsonWriter', function () {
    describe('writeEnvironment', function () {
        let writer: JsonWriterV3;

        beforeEach(() => {
            writer = new JsonWriterV3();
        });

        it('writes an AAS environment', () => {
            expect(writer.write(aasEnvironment)).toBeDefined();
        });
    });

    describe('write', () => {
        let writer: JsonWriterV3;

        beforeEach(() => {
            writer = new JsonWriterV3();
        });

        it('serializes every collection in the environment', () => {
            const result = JSON.parse(writer.write(aasEnvironment)) as typeof aasEnvironment;

            expect(result.assetAdministrationShells?.map(item => item.id)).toEqual(
                aasEnvironment.assetAdministrationShells?.map(item => item.id),
            );

            expect(result.submodels?.map(item => item.id)).toEqual(aasEnvironment.submodels?.map(item => item.id));
            expect(result.conceptDescriptions?.map(item => item.id)).toEqual(
                aasEnvironment.conceptDescriptions?.map(item => item.id),
            );

            expect(result.submodels?.[0].submodelElements?.[0]).toMatchObject({
                idShort: 'Manufacturer',
                modelType: 'Property',
                value: 'CUSTOMER GmbH',
            });
        });

        it('writes empty collections when they are omitted', () => {
            expect(JSON.parse(writer.write({}))).toEqual({
                assetAdministrationShells: [],
                submodels: [],
                conceptDescriptions: [],
            });
        });
    });
});
