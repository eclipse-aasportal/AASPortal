/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ClientMonitoredItem, DataValue } from 'node-opcua';
import { Logger } from '../../logging/logger.js';
import { LiveNode } from 'aas-core';
import { SocketItem } from '../socket-item.js';
import { SocketClient } from '../socket-client.js';

export class OpcuaSocketItem implements SocketItem {
    private item?: ClientMonitoredItem;

    public constructor(
        private readonly logger: Logger,
        private readonly client: SocketClient,
        public readonly node: LiveNode,
    ) {}

    public subscribe(item: ClientMonitoredItem): void {
        this.item = item;
        this.item.on('changed', this.valueChanged);
        this.item.on('err', this.onError);
    }

    public unsubscribe(): void {
        if (this.item) {
            this.item.off('changed', this.valueChanged);
            this.item.off('err', this.onError);
            this.item.terminate();
        }
    }

    private valueChanged = (dataValue: DataValue): void => {
        this.node.value = dataValue.value.value;
        this.node.timeStamp = dataValue.serverTimestamp?.valueOf();
        this.client.notify({
            type: 'LiveNode[]',
            data: [this.node],
        });
    };

    private onError = (message: string): void => {
        this.logger.error(message);
    };
}
