/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Logger } from '../../../app/logging/logger.js';
import { createSpyObj } from '../../utils.js';
import { SocketClient } from '../../../app/live/socket-client.js';
import { HttpSocketItem } from '../../../app/live/http/http-socket-item.js';

describe('HttpSocketItem', function () {
    let item: HttpSocketItem;
    let logger: jest.Mocked<Logger>;
    let client: jest.Mocked<SocketClient>;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        client = createSpyObj<SocketClient>([]);
        item = new HttpSocketItem({ nodeId: '', valueType: 'xs:integer' }, 'http://localhost:1234');
    });

    it('should be created', function() {
        expect(item).toBeTruthy();
        expect(item.url).toEqual('http://localhost:1234');
        expect(item.node).toEqual({ nodeId: '', valueType: 'xs:integer' });
    });
});