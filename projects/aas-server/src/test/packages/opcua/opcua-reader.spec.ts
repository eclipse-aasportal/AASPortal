/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Logger } from "../../../app/logging/logger.js";
import { OpcuaReader } from '../../../app/packages/opcua/opcua-reader.js';
import { OPCUAComponent } from "../../../app/packages/opcua/opcua.js";
import { OpcuaDataTypeDictionary } from "../../../app/packages/opcua/opcua-data-type-dictionary.js";
import { createSpyObj } from '../../utils.js';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

describe('OPCUAReader', function () {
    let reader: OpcuaReader;
    let logger: jest.Mocked<Logger>;
    let origin: jest.Mocked<OPCUAComponent>;
    let dataTypes: jest.Mocked<OpcuaDataTypeDictionary>;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        origin = createSpyObj<OPCUAComponent>({}, ['displayName', 'hasProperty', 'nodeClass']);
        dataTypes = createSpyObj<OpcuaDataTypeDictionary>(['get']);
        reader = new OpcuaReader(logger, origin, dataTypes);
    });

    it('should be created', function () {
        expect(reader).toBeTruthy();
    });
});