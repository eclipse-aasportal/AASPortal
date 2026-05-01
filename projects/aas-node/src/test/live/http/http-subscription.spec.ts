/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, Mocked, vi } from 'vitest';
import { aas, LiveRequest } from 'aas-core';
import { HttpSubscription } from '../../../app/live/http/http-subscription.js';
import { SocketClient } from '../../../app/live/socket-client.js';
import { ApiClient } from '../../../app/client/api/api-client.js';
import { aasEnvironment } from '../../assets/aas-environment.js';
import { createSpyObj } from '../../mocks.js';

describe('HttpSubscription', function () {
    let aasxServer: Mocked<ApiClient>;
    let client: Mocked<SocketClient>;
    let subscription: HttpSubscription;

    beforeEach(() => {
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

        subscription = new HttpSubscription(aasxServer, client, request, aasEnvironment);
    });

    it('should be created', () => {
        expect(subscription).toBeTruthy();
    });

    it('open/close subscription', async () => {
        vi.useFakeTimers();
        aasxServer.readValue.mockResolvedValue('42');
        subscription.open();
        subscription.close();
        vi.advanceTimersByTime(500);
        expect(aasxServer.readValue).toHaveBeenCalledTimes(0);
        vi.useRealTimers();
    });
});