/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect } from '@jest/globals';
<<<<<<< HEAD:projects/aas-node/src/test/package/json-writer-v2.spec.ts
import { JsonWriterV2 } from '../../app/package/json-writer-v2.js';
=======
import { JsonWriterV2 } from '../../lib/writer/json-writer-v2.js';
>>>>>>> development:projects/aas-package/src/test/writer/json-writer-v2.spec.ts
import { aasEnvironment } from '../assets/aas-environment.js';

describe('JsonWriterV2', function () {
    describe('writeEnvironment', function () {
        let writer: JsonWriterV2;

        beforeEach(() => {
            writer = new JsonWriterV2();
        });

        it('is not implemented', () => {
            expect(() => writer.write(aasEnvironment)).toThrow();
        });
    });

    describe('write', () => {
        let writer: JsonWriterV2;

        beforeEach(() => {
            writer = new JsonWriterV2();
        });

        it('does not support writing an AAS', () => {
            expect(() => writer.convert(aasEnvironment.assetAdministrationShells[0])).toThrow();
        });

        it('writes a submodel', () => {
            expect(writer.convert(aasEnvironment.submodels[0])).toBeDefined();
        });
    });
});
