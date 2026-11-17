/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import { WebSocket } from 'ws';
import { SocketClient } from './socket-client.js';
import { createSpyObj } from '../../test/mocks.js';
import { SocketSubscription } from './socket-subscription.js';

describe('SocketClient', function () {
    let client: SocketClient;
    let ws: Mocked<WebSocket>;

    beforeEach(function () {
        ws = createSpyObj<WebSocket>(['on', 'send']);
        client = new SocketClient(ws);
    });

    it('should be created', function () {
        expect(client).toBeTruthy();
    });

    it('can subscribe for notifications', function () {
        expect(client.has('test')).toBeFalsy();
        const subscription = createSpyObj<SocketSubscription>(['open', 'close']);
        client.subscribe('test', subscription);
        expect(client.has('test')).toBeTruthy();

        client.notify({ type: 'test', data: 42 });
        expect(ws.send).toHaveBeenCalled();
    });
});
