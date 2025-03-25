/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { LiveNode } from 'aas-core';
import { OpcuaSocketItem } from './opcua-socket-item.js';
import { OpcuaClient } from '../../package/opcua/opcua-client.js';
import { Logger } from '../../logging/logger.js';
import { SocketClient } from '../socket-client.js';
import { SocketSubscription } from '../socket-subscription.js';
import {
    AttributeIds,
    ClientMonitoredItem,
    ClientSubscription,
    MonitoringParametersOptions,
    NodeId,
    ReadValueIdOptions,
    TimestampsToReturn,
} from 'node-opcua';

export class OpcuaSubscription extends SocketSubscription {
    private readonly server: OpcuaClient;
    private readonly items: OpcuaSocketItem[];
    private subscription?: ClientSubscription;

    public constructor(
        private readonly logger: Logger,
        client: SocketClient,
        server: OpcuaClient,
        nodes: LiveNode[],
    ) {
        super();

        this.server = server;
        this.items = nodes.map(node => new OpcuaSocketItem(logger, client, node));
    }

    public open(): void {
        this.subscription = ClientSubscription.create(this.server.getSession(), {
            requestedPublishingInterval: 1000,
            requestedLifetimeCount: 100,
            requestedMaxKeepAliveCount: 10,
            maxNotificationsPerPublish: 100,
            publishingEnabled: true,
            priority: 10,
        });

        this.subscription
            .on('started', this.onSubscriptionStarted)
            .on('keepalive', this.onSubscriptionKeepAlive)
            .on('terminated', this.onSubscriptionTerminated)
            .on('error', this.onSubscriptionError)
            .on('internal_error', this.onSubscriptionError);

        for (const item of this.items as OpcuaSocketItem[]) {
            const itemToMonitor: ReadValueIdOptions = {
                nodeId: NodeId.resolveNodeId(item.node.nodeId),
                attributeId: AttributeIds.Value,
            };

            const parameters: MonitoringParametersOptions = {
                samplingInterval: 100,
                discardOldest: true,
                queueSize: 10,
            };

            const monitoredItem = ClientMonitoredItem.create(
                this.subscription,
                itemToMonitor,
                parameters,
                TimestampsToReturn.Both,
            );

            item.subscribe(monitoredItem);
        }
    }

    public close(): void {
        this.items?.forEach(item => item.unsubscribe());

        if (this.subscription) {
            this.subscription
                .off('started', this.onSubscriptionStarted)
                .off('keepalive', this.onSubscriptionKeepAlive)
                .off('terminated', this.onSubscriptionTerminated)
                .off('error', this.onSubscriptionError)
                .off('internal_error', this.onSubscriptionError);

            this.subscription.terminate();
        }
    }

    private onSubscriptionStarted = (subscriptionId: number): void => {
        this.logger.debug(`Subscription ${subscriptionId} started.`);
    };

    private onSubscriptionKeepAlive = (): void => {
        this.logger.debug(`Subscription ${this.subscription?.subscriptionId} keep alive.`);
    };

    private onSubscriptionTerminated = (): void => {
        this.logger.debug(`Subscription ${this.subscription?.subscriptionId} terminated.`);
    };

    private onSubscriptionError = (error: Error): void => {
        this.logger.error(error);
    };
}
