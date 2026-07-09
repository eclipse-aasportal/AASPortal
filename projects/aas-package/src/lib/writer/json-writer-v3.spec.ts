/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { JsonWriterV3 } from './json-writer-v3.js';
import { aasEnvironment } from '../../test/assets/aas-environment.js';
import { describe, beforeEach, it, expect } from 'vitest';

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

        it.skip('does not support writing an AAS', () => {
            expect(() => writer.convert(aasEnvironment.assetAdministrationShells[0])).toThrow();
        });
    });
});
