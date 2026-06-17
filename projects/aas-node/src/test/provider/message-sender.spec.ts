/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import { MessageSender } from '../../app/provider/message-sender';
import { WSNode } from '../../app/ws-node';
import { createDocument, createSpyObj } from '../mocks';

describe('MessageSender', () => {
    let messageSender: MessageSender;
    let wsServer: Mocked<WSNode>;

    beforeEach(() => {
        wsServer = createSpyObj<WSNode>(['notify']);
        messageSender = new MessageSender(wsServer, 10);
    });

    it('should batch messages and send them at the specified interval', async () => {
        messageSender.send({ type: 'Added', document: createDocument('Message 1') });
        messageSender.send({ type: 'Added', document: createDocument('Message 2') });

        expect(wsServer.notify).not.toHaveBeenCalled();

        await new Promise(resolve => setTimeout(resolve, 20));

        expect(wsServer.notify).toHaveBeenCalledWith('IndexChange', {
            type: 'AASNodeMessage[]',
            data: [
                { type: 'Added', document: createDocument('Message 1') },
                { type: 'Added', document: createDocument('Message 2') },
            ],
        });
    });
});
