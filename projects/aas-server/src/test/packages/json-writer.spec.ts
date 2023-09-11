/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
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

        beforeEach(function(){
            writer = new JsonWriter();
        });

        it('writes an AAS environment', function() {
            expect(writer.writeEnvironment(env)).toBeDefined();
        })
    });

    describe('write', function() {
        let writer: JsonWriter;

        beforeEach(function(){
            writer = new JsonWriter();
        });

        it('does not support writing an AAS', function() {
            expect(() => writer.write(env.assetAdministrationShells[0])).toThrowError();
        });
    });
});