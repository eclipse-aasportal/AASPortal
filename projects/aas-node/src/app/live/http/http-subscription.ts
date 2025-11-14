/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, changeType, LiveNode, LiveRequest, noop } from 'aas-core';
import { HttpSocketItem } from './http-socket-item.js';
import { Logger } from '../../logging/logger.js';
import { SocketClient } from '../socket-client.js';
import { ApiClient } from '../../client/api/api-client.js';
import { SocketSubscription } from '../socket-subscription.js';

export class HttpSubscription extends SocketSubscription {
    private readonly items: HttpSocketItem[];
    private timeout = 300;
    private timeoutId?: NodeJS.Timeout;

    public constructor(
        private readonly logger: Logger,
        private readonly server: ApiClient,
        private readonly client: SocketClient,
        message: LiveRequest,
        env: aas.Environment,
    ) {
        super();

        this.items = message.nodes.map(
            node => new HttpSocketItem(node, server.resolveNodeId(env.assetAdministrationShells[0], node.nodeId)),
        );
    }

    public open(): void {
        if (this.timeoutId) {
            return;
        }

        this.timeoutId = setTimeout(this.readValues, 10);
    }

    public close(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
        }
    }

    private readonly readValues = async (): Promise<void> => {
        const nodes: Array<LiveNode> = [];
        for (const item of this.items) {
            try {
                item.node.value = changeType(
                    await this.server.readValue(item.url, item.node.valueType),
                    item.node.valueType,
                );

                item.node.timeStamp = Date.now();
                nodes.push(item.node);
            } catch {
                noop();
            }
        }

        if (nodes.length > 0) {
            this.client.notify({
                type: 'LiveNode[]',
                data: nodes,
            });
        }

        this.timeoutId = setTimeout(this.readValues, this.timeout);
    };
}
