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
import { createSpyObj } from 'fhg-jest';
import { OpcuaClient } from '../../../app/package/opcua/opcua-client.js';

describe('OpcuaPackage', function () {
    let aasPackage: OpcuaPackage;
    let logger: jest.Mocked<Logger>;
    let server: jest.Mocked<OpcuaClient>;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        server = createSpyObj<OpcuaClient>(['open', 'close', 'getSession'], { isOpen: true });
        aasPackage = new OpcuaPackage(logger, server, 'ns=1;i=42');
    });

    it('should be created', function () {
        expect(aasPackage).toBeTruthy();
    });
});