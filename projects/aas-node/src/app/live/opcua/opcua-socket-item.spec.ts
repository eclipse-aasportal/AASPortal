/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { ClientMonitoredItem } from 'node-opcua';
import { Logger } from 'aas-package';

import { OpcuaSocketItem } from './opcua-socket-item.js';
import { SocketClient } from '../socket-client.js';
import { createSpyObj } from '../../../test/mocks.js';

describe('OpcuaSocketItem', () => {
    let item: OpcuaSocketItem;
    let logger: Mocked<Logger>;
    let client: Mocked<SocketClient>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
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
