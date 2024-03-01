/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { readFile } from 'fs/promises';
import { JsonReader } from '../../app/packages/json-reader.js';
import { resolve } from 'path/posix';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('JsonReader', function () {
    let reader: JsonReader;
    let json: string;

    beforeEach(async function () {
        json = (await readFile(resolve('./src/test/assets/aas-example.json'))).toString();
        reader = new JsonReader(json);
    });

    it('should be created', function () {
        expect(reader).toBeTruthy();
    });

    it('reads the AAS environment from a JSON source', function () {
        const env = reader.readEnvironment();
        expect(env).toBeDefined();
    });
});
