/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { JsonWriterV3 } from '../../app/package/json-writer-v3.js';
import env from '../assets/aas-environment.js';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('JsonWriter', function () {
    describe('writeEnvironment', function () {
        let writer: JsonWriterV3;

        beforeEach(() => {
            writer = new JsonWriterV3();
        });

        it('writes an AAS environment', () => {
            expect(writer.write(env)).toBeDefined();
        });
    });

    describe('write', () => {
        let writer: JsonWriterV3;

        beforeEach(() => {
            writer = new JsonWriterV3();
        });

        it('does not support writing an AAS', () => {
            expect(() => writer.convert(env.assetAdministrationShells[0])).toThrowError();
        });
    });
});
