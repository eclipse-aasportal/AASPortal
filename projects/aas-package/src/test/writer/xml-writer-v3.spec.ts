/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect } from '@jest/globals';
import { aasEnvironment } from '../assets/aas-environment.js';
<<<<<<< HEAD:projects/aas-node/src/test/package/xml-writer-v3.spec.ts
import { XmlWriterV3 } from '../../app/package/xml-writer-v3.js';
=======
import { XmlWriterV3 } from '../../lib/writer/xml-writer-v3.js';
>>>>>>> development:projects/aas-package/src/test/writer/xml-writer-v3.spec.ts

describe('XmlWriterV3', () => {
    let writer: XmlWriterV3;

    beforeEach(() => {
        writer = new XmlWriterV3();
    });

    describe('writeEnvironment', () => {
        it('writes an AAS environment', () => {
            const xml = writer.write(aasEnvironment);
            expect(xml).toBeDefined();
        });
    });
});
