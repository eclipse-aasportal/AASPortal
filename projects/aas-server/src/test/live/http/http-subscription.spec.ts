/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Logger } from '../../../app/logging/logger.js';
import { HttpSubscription } from '../../../app/live/http/http-subscription.js';
import { SocketClient } from '../../../app/live/socket-client.js';
import { aas, LiveRequest } from 'common';
import { AasxServer } from '../../../app/packages/aasx-server/aasx-server.js';
import env from '../../assets/aas-environment.js';
import { createSpyObj, DoneFn } from '../../utils.js';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

describe('HttpSubscription', function () {
    let aasxServer: jest.Mocked<AasxServer>;
    let logger: jest.Mocked<Logger>;
    let client: jest.Mocked<SocketClient>;
    let subscription: HttpSubscription;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        client = createSpyObj<SocketClient>(['has', 'subscribe', 'notify']);
        aasxServer = createSpyObj<AasxServer>(
            ['getShellsAsync', 'commitAsync', 'openFileAsync', 'readValueAsync', 'resolveNodeId']);

        const reference: aas.Reference = {
            type: 'ModelReference',
            keys: [{
                type: 'Submodel',
                value: 'http://i40.customer.com/type/1/1/F13E8576F6488342'
            },
            {
                type: 'Property',
                value: 'GLN',
            }]
        };

        const request: LiveRequest = {
            endpoint: {
                url: 'file://doc',
                name: 'Test',
                type: 'AasxDirectory',

            },
            id: 'http://customer.com/aas/9175_7013_7091_9168',
            nodes: [{
                nodeId: JSON.stringify(reference),
                valueType: 'xs:integer'
            }],
        };

        subscription = new HttpSubscription(logger, aasxServer, client, request, env);
    });

    it('should be created', function () {
        expect(subscription).toBeTruthy();
    });

    it('open/close subscription', function (done: DoneFn) {
        jest.useFakeTimers();
        aasxServer.readValueAsync.mockReturnValue(new Promise<any>(result => {
            expect(true).toBeTruthy();
            result(42);
            subscription.close();
            done();
        }));

        subscription.open();
    });
});