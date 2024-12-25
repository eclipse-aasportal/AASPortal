/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { readFile } from 'fs/promises';
import { JsonReaderV3 } from '../../app/package/json-reader-v3.js';
import { resolve } from 'path/posix';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('JsonReaderV3', function () {
    let reader: JsonReaderV3;
    let json: string;

    beforeEach(async function () {
        json = (await readFile(resolve('./src/test/assets/aas-example.json'))).toString();
        reader = new JsonReaderV3(json);
    });

    it('should be created', function () {
        expect(reader).toBeTruthy();
    });

    it('reads the AAS environment from a JSON source', function () {
        const env = reader.readEnvironment();
        expect(env).toBeDefined();
    });
});
