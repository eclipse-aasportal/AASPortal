/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { OpcuaPackage } from "../../../app/packages/opcua/opcua-package.js";
import { Logger } from "../../../app/logging/logger.js";
import { createSpyObj } from "../../utils.js";
import { OpcuaServer } from "../../../app/packages/opcua/opcua-server.js";

describe('OpcuaPackage', function () {
    let aasPackage: OpcuaPackage;
    let logger: jest.Mocked<Logger>;
    let server: jest.Mocked<OpcuaServer>;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        server = createSpyObj<OpcuaServer>(['openAsync', 'closeAsync', 'getSession'], { isOpen: true });
        aasPackage = new OpcuaPackage(logger, server, 'ns=1;i=42');
    });

    it('should be created', function () {
        expect(aasPackage).toBeTruthy();
    });
});