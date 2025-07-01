/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { OpcuaPackage } from '../../../app/package/opcua/opcua-package.js';
import { Logger } from '../../../app/logging/logger.js';
import { createSpyObj } from 'aas-jest';
import { OpcuaClient } from '../../../app/package/opcua/opcua-client.js';

describe('OpcuaPackage', () => {
    let aasPackage: OpcuaPackage;
    let logger: jest.Mocked<Logger>;
    let server: jest.Mocked<OpcuaClient>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        server = createSpyObj<OpcuaClient>(['open', 'close', 'getSession'], { isOpen: true });
        aasPackage = new OpcuaPackage(logger, server, 'ns=1;i=42');
    });

    it('should be created', () => {
        expect(aasPackage).toBeTruthy();
    });
});
