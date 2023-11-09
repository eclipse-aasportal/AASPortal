/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { noop } from "lodash-es";
import { aas, changeType, LiveNode, LiveRequest } from "common";
import { HttpSocketItem } from "./http-socket-item.js";
import { Logger } from "../../logging/logger.js";
import { SocketClient } from "../socket-client.js";
import { AasxServer } from "../../packages/aasx-server/aasx-server.js";
import { SocketSubscription } from "../socket-subscription.js";

export class HttpSubscription extends SocketSubscription {
    private readonly items: HttpSocketItem[];
    private timeout = 300;
    private timeoutId?: NodeJS.Timeout;

    constructor(
        private readonly logger: Logger,
        private readonly server: AasxServer,
        private readonly client: SocketClient,
        message: LiveRequest,
        env: aas.Environment) {
        super();

        this.items = message.nodes.map(node => new HttpSocketItem(
            node,
            server.resolveNodeId(env.assetAdministrationShells[0], node.nodeId)));
    }

    public open(): void {
        if (!this.timeoutId) {
            this.timeoutId = setTimeout(this.readValues.bind(this), 10);
        } else {
            this.logger.debug(`The subscription ${this.server.url} is already open.`);
        }
    }

    public close(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
        }
    }

    private async readValues(): Promise<void> {
        this.timeoutId = undefined;
        const nodes: Array<LiveNode> = [];
        for (const item of this.items) {
            try {
                item.node.value = changeType(
                    await this.server.readValueAsync(item.url, item.node.valueType),
                    item.node.valueType);

                item.node.timeStamp = Date.now();
                nodes.push(item.node);
            } catch (error) {
                noop();
            }
        }

        if (nodes.length > 0) {
            this.client.notify({
                type: "LiveNode[]",
                data: nodes
            });
        }

        this.timeoutId = setTimeout(this.readValues.bind(this), this.timeout);
    }
}