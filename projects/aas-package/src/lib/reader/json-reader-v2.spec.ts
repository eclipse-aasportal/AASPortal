/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { readFile } from 'fs/promises';
import { JsonReaderV2 } from './json-reader-v2.js';

describe('JsonReaderV2', function () {
    let reader: JsonReaderV2;
    let json: string;

    beforeEach(async function () {
        const file = fileURLToPath(new URL('../../test/assets/aas-example-v2.json', import.meta.url));
        json = (await readFile(file)).toString();
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
