/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeAll, beforeEach, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { readFile } from 'fs/promises';
import { XmlReaderV1 } from '../../lib/reader/xml-reader-v1.js';

describe('XmlReader', function () {
    describe('with default namespace v2.0', function () {
        let reader: XmlReaderV1;
        let xml: string;
        let path: string;

        beforeAll(async function () {
            path = fileURLToPath(new URL('../assets/aas-default-namespace.xml', import.meta.url));
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
            path =  fileURLToPath(new URL('../assets/aas-prefix-namespace.xml', import.meta.url));
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