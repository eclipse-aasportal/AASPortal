/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { createSpyObj } from 'aas-jest';
<<<<<<< HEAD
import { Logger } from '../../../app/logging/logger.js';
import { OpcuaReader } from '../../../app/package/opcua/opcua-reader.js';
import { OPCUAComponent } from '../../../app/package/opcua/opcua.js';
import { OpcuaDataTypeDictionary } from '../../../app/package/opcua/opcua-data-type-dictionary.js';
=======
import { OpcuaReader } from '../../../app/client/opcua/opcua-reader.js';
import { OPCUAComponent } from '../../../app/client/opcua/opcua.js';
import { OpcuaDataTypeDictionary } from '../../../app/client/opcua/opcua-data-type-dictionary.js';
>>>>>>> development

describe('OpcuaReader', () => {
    let reader: OpcuaReader;
    let origin: jest.Mocked<OPCUAComponent>;
    let dataTypes: jest.Mocked<OpcuaDataTypeDictionary>;

    beforeEach(() => {
<<<<<<< HEAD
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
=======
>>>>>>> development
        origin = createSpyObj<OPCUAComponent>({}, ['displayName', 'hasProperty', 'nodeClass']);
        dataTypes = createSpyObj<OpcuaDataTypeDictionary>(['get']);
        reader = new OpcuaReader(origin, dataTypes);
    });

    it('should be created', () => {
        expect(reader).toBeTruthy();
    });
});
