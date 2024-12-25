/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ClientMonitoredItem } from 'node-opcua';
import { OpcuaSocketItem } from '../../../app/live/opcua/opcua-socket-item.js';
import { Logger } from '../../../app/logging/logger.js';
import { createSpyObj } from 'fhg-jest'
import { SocketClient } from '../../../app/live/socket-client.js';

describe('OpcuaSocketItem', () => {
    let item: OpcuaSocketItem;
    let logger: jest.Mocked<Logger>;
    let client: jest.Mocked<SocketClient>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        client = createSpyObj<SocketClient>([]);
        item = new OpcuaSocketItem(logger, client, { nodeId: '', valueType: 'xs:integer' });
    });

    it('should be created', () => {
        expect(item).toBeTruthy();
    });

    it('can subscribe/unsubscribe', () => {
        const monitoredItem = createSpyObj<ClientMonitoredItem>(['on', 'off', 'terminate']);
        item.subscribe(monitoredItem);
        expect(monitoredItem.on).toHaveBeenCalled();

        item.unsubscribe();
        expect(monitoredItem.off).toHaveBeenCalled();
        expect(monitoredItem.terminate).toHaveBeenCalled();
    });
});
