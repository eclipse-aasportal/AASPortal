/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, expect, it } from '@jest/globals';
import { readFile } from 'fs/promises';
import { resolve } from 'path/posix';
import { aas } from 'aas-core';
import { XmlReaderV3 } from '../../app/package/xml-reader-v3.js';

describe('XmlReaderV3', () => {
    let reader: XmlReaderV3;
    let xml: string;
    let path: string;

    beforeEach(async () => {
        path = resolve('./src/test/assets/aas-example-v3.xml');
        xml = (await readFile(path)).toString();
        reader = new XmlReaderV3(xml);
    });

    it('should be created', function () {
        expect(reader).toBeTruthy();
    });

    it('reads the AAS environment from a xml source', function () {
        const environment = reader.readEnvironment();
        expect(environment).toBeDefined();
    });

    describe('read Operation', () => {
        beforeEach(async () => {
            path = resolve('./src/test/assets/xml/v3/operation.xml');
            xml = (await readFile(path)).toString();
            reader = new XmlReaderV3(xml);
        });

        it('reads an Operation element', () => {
            const env = reader.readEnvironment();
            const operation = env.submodels![0].submodelElements![0] as aas.Operation;
            expect(operation.modelType === 'Operation').toBeTruthy();
            expect(operation.inputVariables?.length).toEqual(1);
            expect(operation.inoutputVariables?.length).toEqual(1);
            expect(operation.outputVariables?.length).toEqual(1);
        });
    });
});
