/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect } from '@jest/globals';
import env from '../assets/aas-environment.js';
import { XmlWriterV3 } from '../../app/package/xml-writer-v3.js';

describe('XmlWriterV3', () => {
    let writer: XmlWriterV3;

    beforeEach(() => {
        writer = new XmlWriterV3();
    });

    describe('writeEnvironment', () => {
        it('writes an AAS environment', () => {
            const xml = writer.write(env);
            expect(xml).toBeDefined();
        });
    });
});