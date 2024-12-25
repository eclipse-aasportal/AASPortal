/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { readFile } from 'fs/promises';
import { JsonReaderV2 } from '../../app/package/json-reader-v2.js';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('JsonReaderV2', function () {
    let reader: JsonReaderV2;
    let json: string;

    beforeEach(async function () {
        json = (await readFile('./src/test/assets/aas-example-v2.json')).toString();
        reader = new JsonReaderV2(json);
    });

    it('should be created', function () {
        expect(reader).toBeTruthy();
    });

    it('reads the AAS environment from a JSON source', function () {
        const env = reader.readEnvironment();
        expect(env).toBeDefined();
    });
});
