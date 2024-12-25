/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import EventEmitter from 'events';
import WebSocket from 'ws';
import { WebSocketData } from 'aas-core';
import { SocketSubscription } from './socket-subscription.js';

export class SocketClient extends EventEmitter {
    private readonly ws: WebSocket;
    private readonly subscriptions = new Map<string, SocketSubscription>();

    public constructor(ws: WebSocket) {
        super();

        this.ws = ws;
        this.ws.on('message', this.onMessage);
        this.ws.on('close', this.onClose);
        this.ws.on('error', this.onError);
    }

    public has(name: string): boolean {
        return this.subscriptions.has(name);
    }

    public subscribe(name: string, subscription: SocketSubscription) {
        subscription.open();
        this.subscriptions.set(name, subscription);
    }

    public notify(data: WebSocketData): void {
        return this.ws.send(JSON.stringify(data));
    }

    public close(): void {
        this.ws.off('message', this.onMessage);
        this.ws.off('close', this.onClose);
        this.ws.off('error', this.onError);
        this.ws.close();
    }

    private onMessage = (rawData: WebSocket.RawData): void => {
        let data: WebSocketData;
        if (rawData instanceof Buffer) {
            data = JSON.parse(rawData.toString());
            this.emit('message', data, this);
        }
    };

    private onClose = (code: number, reason: string): void => {
        this.ws.removeAllListeners();

        for (const subscription of this.subscriptions.values()) {
            subscription.close();
        }

        this.subscriptions.clear();

        this.emit('close', code, reason, this);
    };

    private onError = (error: Error): void => {
        this.emit('error', error, this);
    };
}
