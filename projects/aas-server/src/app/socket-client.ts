/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import EventEmitter from 'events';
import WebSocket from 'ws';
import { ListenerFn, WebSocketData } from './types.js';

export class SocketClient {
    private readonly ws: WebSocket;
    private readonly emitter = new EventEmitter();

    public constructor(ws: WebSocket) {
        this.ws = ws;
        this.ws.on('message', this.onMessage);
        this.ws.on('close', this.onClose);
        this.ws.on('error', this.onError);
    }

    public on(event: 'message' | 'close' | 'error', listener: ListenerFn): EventEmitter {
        return this.emitter.on(event, listener);
    }

    public off(event: 'message' | 'close' | 'error', listener: ListenerFn): EventEmitter {
        return this.emitter.off(event, listener);
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
            this.emitter.emit('message', data, this);
        }
    };

    private onClose = (code: number, reason: string): void => {
        this.ws.removeAllListeners();
        this.emitter.emit('close', code, reason, this);
    };

    private onError = (error: Error): void => {
        this.emitter.emit('error', error, this);
    };
}
