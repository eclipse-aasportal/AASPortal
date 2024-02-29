/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect } from '@jest/globals';
import env from '../assets/aas-environment.js';
import { XmlWriter } from '../../app/packages/xml-writer.js';

describe('XmlWriter', () => {
    let writer: XmlWriter;

    beforeEach(() => {
        writer = new XmlWriter();
    });

    describe('writeEnvironment', () => {
        it('writes an AAS environment', () => {
            const xml = writer.write(env);
            console.log(xml);
            expect(xml).toBeDefined();
        });
    });
});
