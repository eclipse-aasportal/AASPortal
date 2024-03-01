/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeAll, beforeEach, it, expect } from '@jest/globals';
import { readFile } from 'fs/promises';
import { resolve } from 'path/posix';
import { XmlReader } from '../../app/packages/xml-reader.js';

describe('XmlReader', function () {
    let reader: XmlReader;
    let xml: string;
    let path: string;

    beforeAll(async function () {
        path = resolve('./src/test/assets/aas-example-v3.xml');
        xml = (await readFile(path)).toString();
    });

    beforeEach(function () {
        reader = new XmlReader(xml);
    });

    it('should be created', function () {
        expect(reader).toBeTruthy();
    });

    it('reads the AAS environment from a xml source', function () {
        const environment = reader.readEnvironment();
        expect(environment).toBeDefined();
    });
});
