/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { OpcuaSubscription } from '../../../app/live/opcua/opcua-subscription.js';
import { createSpyObj } from '../../mocks.js';
import { Logger } from '../../../app/logging/logger.js';
import { SocketClient } from '../../../app/live/socket-client.js';
import { OpcuaClient } from '../../../app/client/opcua/opcua-client.js';

describe('OpcuaSubscription', function () {
    let subscription: OpcuaSubscription;
    let logger: Mocked<Logger>;
    let client: Mocked<SocketClient>;
    let server: Mocked<OpcuaClient>;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
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