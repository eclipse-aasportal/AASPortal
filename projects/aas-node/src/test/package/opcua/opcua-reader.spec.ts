/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { createSpyObj } from 'fhg-jest';
import { Logger } from '../../../app/logging/logger.js';
import { OpcuaReader } from '../../../app/package/opcua/opcua-reader.js';
import { OPCUAComponent } from '../../../app/package/opcua/opcua.js';
import { OpcuaDataTypeDictionary } from '../../../app/package/opcua/opcua-data-type-dictionary.js';

describe('OpcuaReader', () => {
    let reader: OpcuaReader;
    let logger: jest.Mocked<Logger>;
    let origin: jest.Mocked<OPCUAComponent>;
    let dataTypes: jest.Mocked<OpcuaDataTypeDictionary>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        origin = createSpyObj<OPCUAComponent>({}, ['displayName', 'hasProperty', 'nodeClass']);
        dataTypes = createSpyObj<OpcuaDataTypeDictionary>(['get']);
        reader = new OpcuaReader(logger, origin, dataTypes);
    });

    it('should be created', () => {
        expect(reader).toBeTruthy();
    });
});