/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { OpcuaSubscription } from '../../../app/live/opcua/opcua-subscription.js';
import { createSpyObj } from 'fhg-jest';
import { Logger } from '../../../app/logging/logger.js';
import { SocketClient } from '../../../app/live/socket-client.js';
import { OpcuaClient } from '../../../app/package/opcua/opcua-client.js';

describe('OpcuaSubscription', function () {
    let subscription: OpcuaSubscription;
    let logger: jest.Mocked<Logger>;
    let client: jest.Mocked<SocketClient>;
    let server: jest.Mocked<OpcuaClient>;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        client = createSpyObj<SocketClient>(['has', 'subscribe', 'notify']);
        server = createSpyObj<OpcuaClient>(['getSession']);
        subscription = new OpcuaSubscription(logger, client, server, [
            {
                nodeId: 'ns=1;i=42',
                valueType: 'xs:integer',
            },
        ]);
    });

    it('should be created', function () {
        expect(subscription).toBeTruthy();
    });
});
