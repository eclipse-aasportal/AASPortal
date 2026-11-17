/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, changeType, LiveNode, LiveRequest } from 'aas-core';
import { HttpSocketItem } from './http-socket-item.js';
import { SocketClient } from '../socket-client.js';
import { ApiClient } from '../../client/api/api-client.js';
import { SocketSubscription } from '../socket-subscription.js';

export class HttpSubscription extends SocketSubscription {
    private readonly items: HttpSocketItem[];
    private readonly timeout = 300;
    private timeoutId?: NodeJS.Timeout;

    public constructor(
        private readonly api: ApiClient,
        private readonly socket: SocketClient,
        message: LiveRequest,
        env: aas.Environment,
    ) {
        super();
        const aas = env.assetAdministrationShells?.at(0);
        this.items = aas
            ? message.nodes.map(node => new HttpSocketItem(node, api.resolveNodeId(aas, node.nodeId)))
            : [];
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
                const value = await this.api.readValue(item.url, item.node.valueType);
                item.node.value = changeType(value, item.node.valueType);
                item.node.timeStamp = Date.now();
                nodes.push(item.node);
            } catch (error) {
                console.error(`readValue failed for ${item.url}:`, error);
            }
        }

        if (nodes.length > 0) {
            this.socket.notify({
                type: 'LiveNode[]',
                data: nodes,
            });
        }

        this.timeoutId = setTimeout(this.readValues, this.timeout);
    };
}
