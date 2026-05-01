/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import { createSpyObj } from '../../mocks.js';
import { OpcuaReader } from '../../../app/client/opcua/opcua-reader.js';
import { OPCUAComponent } from '../../../app/client/opcua/opcua.js';
import { OpcuaDataTypeDictionary } from '../../../app/client/opcua/opcua-data-type-dictionary.js';

describe('OpcuaReader', () => {
    let reader: OpcuaReader;
    let origin: Mocked<OPCUAComponent>;
    let dataTypes: Mocked<OpcuaDataTypeDictionary>;

    beforeEach(() => {
        origin = createSpyObj<OPCUAComponent>({}, ['displayName', 'hasProperty', 'nodeClass']);
        dataTypes = createSpyObj<OpcuaDataTypeDictionary>(['get']);
        reader = new OpcuaReader(origin, dataTypes);
    });

    it('should be created', () => {
        expect(reader).toBeTruthy();
    });
});