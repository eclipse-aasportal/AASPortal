/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { aas, DefaultType, LiveRequest } from 'aas-core';
import { createSpyObj, DoneFn } from 'aas-jest';
import { Logger } from '../../../app/logging/logger.js';
import { HttpSubscription } from '../../../app/live/http/http-subscription.js';
import { SocketClient } from '../../../app/live/socket-client.js';
<<<<<<< HEAD
import { ApiClient } from '../../../app/package/api/api-client.js';
=======
import { ApiClient } from '../../../app/client/api/api-client.js';
>>>>>>> development
import { aasEnvironment } from '../../assets/aas-environment.js';

describe('HttpSubscription', function () {
    let aasxServer: jest.Mocked<ApiClient>;
    let logger: jest.Mocked<Logger>;
    let client: jest.Mocked<SocketClient>;
    let subscription: HttpSubscription;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        client = createSpyObj<SocketClient>(['has', 'subscribe', 'notify']);
        aasxServer = createSpyObj<ApiClient>(['readValue', 'resolveNodeId']);

        const reference: aas.Reference = {
            type: 'ModelReference',
            keys: [
                {
                    type: 'Submodel',
                    value: 'http://i40.customer.com/type/1/1/F13E8576F6488342',
                },
                {
                    type: 'Property',
                    value: 'GLN',
                },
            ],
        };

        const request: LiveRequest = {
            endpoint: 'FileSystem',
            id: 'http://customer.com/aas/9175_7013_7091_9168',
            nodes: [
                {
                    nodeId: JSON.stringify(reference),
                    valueType: 'xs:integer',
                },
            ],
        };

        subscription = new HttpSubscription(logger, aasxServer, client, request, aasEnvironment);
    });

    it('should be created', function () {
        expect(subscription).toBeTruthy();
    });

    it('open/close subscription', (done: DoneFn) => {
        jest.useFakeTimers();
        aasxServer.readValue.mockReturnValue(
            new Promise<DefaultType>(result => {
                expect(true).toBeTruthy();
                result(42);
                subscription.close();
                done();
            }),
        );

        subscription.open();
    });
});
