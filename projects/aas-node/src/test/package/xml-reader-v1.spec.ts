/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { readFile } from 'fs/promises';
import { resolve } from 'path/posix';
import { XmlReaderV1 } from '../../app/package/xml-reader-v1.js';
import { describe, beforeAll, beforeEach, it, expect } from '@jest/globals';

describe('XmlReader', function () {
    describe('with default namespace v2.0', function () {
        let reader: XmlReaderV1;
        let xml: string;
        let path: string;

        beforeAll(async function () {
            path = resolve('./src/test/assets/aas-default-namespace.xml');
            xml = (await readFile(path)).toString();
        });

        beforeEach(function () {
            reader = new XmlReaderV1(xml);
        });

        it('should be created', function () {
            expect(reader).toBeTruthy();
        });

        it('reads the AAS environment from a xml source', function () {
            const environment = reader.readEnvironment();
            expect(environment).toBeDefined();
        });
    });

    describe('with prefix namespace v1.0', function () {
        let reader: XmlReaderV1;
        let xml: string;
        let path: string;

        beforeAll(async function () {
            path = resolve('./src/test/assets/aas-prefix-namespace.xml');
            xml = (await readFile(path)).toString();
        });

        beforeEach(function () {
            reader = new XmlReaderV1(xml);
        });

        it('should be created', function () {
            expect(reader).toBeTruthy();
        });

        it('reads the AAS environment from a xml source', function () {
            const environment = reader.readEnvironment();
            expect(environment).toBeDefined();
        });
    });
});
