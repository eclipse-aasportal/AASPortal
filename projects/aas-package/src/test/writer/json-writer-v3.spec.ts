/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

<<<<<<< HEAD:projects/aas-node/src/test/package/json-writer-v3.spec.ts
import { JsonWriterV3 } from '../../app/package/json-writer-v3.js';
=======
import { JsonWriterV3 } from '../../lib/writer/json-writer-v3.js';
>>>>>>> development:projects/aas-package/src/test/writer/json-writer-v3.spec.ts
import { aasEnvironment } from '../assets/aas-environment.js';
import { describe, beforeEach, it, expect } from '@jest/globals';

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
