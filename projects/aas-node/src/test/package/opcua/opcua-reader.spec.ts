/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { createSpyObj } from 'aas-jest';
import { OpcuaReader } from '../../../app/client/opcua/opcua-reader.js';
import { OPCUAComponent } from '../../../app/client/opcua/opcua.js';
import { OpcuaDataTypeDictionary } from '../../../app/client/opcua/opcua-data-type-dictionary.js';

describe('OpcuaReader', () => {
    let reader: OpcuaReader;
    let origin: jest.Mocked<OPCUAComponent>;
    let dataTypes: jest.Mocked<OpcuaDataTypeDictionary>;

    beforeEach(() => {
        origin = createSpyObj<OPCUAComponent>({}, ['displayName', 'hasProperty', 'nodeClass']);
        dataTypes = createSpyObj<OpcuaDataTypeDictionary>(['get']);
        reader = new OpcuaReader(origin, dataTypes);
    });

    it('should be created', () => {
        expect(reader).toBeTruthy();
    });
});
