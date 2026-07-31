/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASNodeMessage } from 'aas-core';
import { WSNode } from '../ws-node.js';

/**
 * Class to send messages to connected WebSocket clients. It batches messages and sends them at a specified interval.
 */
export class MessageSender {
    private messages: AASNodeMessage[] = [];
    private handle: NodeJS.Timeout | null = null;

    public constructor(
        private readonly wsServer: WSNode,
        private readonly delay: number = 1000,
    ) {
        this.handle = setInterval(() => {
            if (this.messages.length === 0) {
                return;
            }

            const messagesToSend = this.messages;
            this.messages = [];

            this.wsServer.notify('IndexChange', {
                type: 'AASNodeMessage[]',
                data: messagesToSend,
            });
        }, this.delay);
    }

    public send(message: AASNodeMessage): void {
        this.messages.push(message);
    }

    public destroy(): void {
        if (this.handle) {
            clearInterval(this.handle);
            this.handle = null;
        }
    }
}
