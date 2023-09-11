/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Logger } from '../../app/logging/logger.js';
import { readFile } from 'fs/promises';
import { JsonReaderV2 } from '../../app/packages/json-reader-v2.js'
import { createSpyObj } from '../utils.js';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

describe('JsonReaderV2', function () {
    let reader: JsonReaderV2;
    let logger: jest.Mocked<Logger>;
    let json: string;

    beforeEach(async function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        json = (await readFile('./src/test/assets/aas-example-v2.json')).toString();
        reader = new JsonReaderV2(logger, json);
    });

    it('should be created', function () {
        expect(reader).toBeTruthy();
    });

    it('reads the AAS environment from a JSON source', function () {
        let env = reader.readEnvironment();
        expect(env).toBeDefined();
    });
});