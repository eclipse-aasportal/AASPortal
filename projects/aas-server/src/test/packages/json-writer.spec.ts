/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { JsonWriter } from '../../app/packages/json-writer.js';
import env from '../assets/aas-environment.js';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('JsonWriter', function () {
    describe('writeEnvironment', function () {
        let writer: JsonWriter;

        beforeEach(() => {
            writer = new JsonWriter();
        });

        it('writes an AAS environment', () => {
            expect(writer.write(env)).toBeDefined();
        });
    });

    describe('write', () => {
        let writer: JsonWriter;

        beforeEach(() => {
            writer = new JsonWriter();
        });

        it('does not support writing an AAS', () => {
            expect(() => writer.convert(env.assetAdministrationShells[0])).toThrowError();
        });
    });
});
