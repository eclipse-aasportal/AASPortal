/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Logger } from '../../app/logging/logger.js';
import { readFile } from 'fs/promises';
import { JsonReader } from '../../app/packages/json-reader.js';
import { resolve } from 'path';
import { createSpyObj } from '../utils.js';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

describe('JsonReader', function () {
    let reader: JsonReader;
    let logger: jest.Mocked<Logger>;
    let json: string;

    beforeEach(async function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        json = (await readFile(resolve('./src/test/assets/aas-example.json'))).toString();
        reader = new JsonReader(logger, json);
    });

    it('should be created', function () {
        expect(reader).toBeTruthy();
    });

    it('reads the AAS environment from a JSON source', function () {
        const env = reader.readEnvironment();
        expect(env).toBeDefined();
    });
});