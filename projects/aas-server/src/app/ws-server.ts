/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, inject, singleton } from 'tsyringe';
import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import https from 'https';
import EventEmitter from 'events';
import fs from 'fs';
import { Logger, LOGGER } from 'aas-package';

import { App } from './app.js';
import { ListenerFn, WebSocketData } from './types.js';
import { Variable } from './variable.js';
import { SocketClient } from './socket-client.js';

@singleton()
export class WSServer {
    private readonly wss: WebSocketServer;
    private readonly clients: Set<SocketClient> = new Set<SocketClient>();
    private readonly server: http.Server | https.Server;
    private readonly emitter = new EventEmitter();

    public constructor(
        @inject(App) private readonly app: App,
        @inject(Variable) private readonly variable: Variable,
        @inject(LOGGER) private readonly logger: Logger,
    ) {
        if (this.variable.HTTPS_KEY_FILE && this.variable.HTTPS_CERT_FILE) {
            this.server = https.createServer({
                key: fs.readFileSync(this.variable.HTTPS_KEY_FILE),
                cert: fs.readFileSync(this.variable.HTTPS_CERT_FILE),
            });
        } else if (this.variable.HTTPS_PFX_FILE) {
            this.server = https.createServer({
                pfx: fs.readFileSync(this.variable.HTTPS_PFX_FILE),
                passphrase: this.variable.AAS_SERVER_PASSWORD,
            });
        } else {
            this.server = http.createServer();
        }

        this.wss = new WebSocketServer({ server: this.server });
        this.server.on('request', app.app);

        this.wss.on('connection', this.onConnection);
        this.wss.on('close', this.onClose);
        this.wss.on('error', this.onError);
    }

    public on(event: 'message' | 'close' | 'error', listener: ListenerFn): EventEmitter {
        return this.emitter.on(event, listener);
    }

    public off(event: 'message' | 'close' | 'error', listener: ListenerFn): EventEmitter {
        return this.emitter.off(event, listener);
    }

    public run(): void {
        process.on('SIGTERM', this.shutdownHandler);
        process.on('SIGINT', this.shutdownHandler);

        this.server.listen(this.variable.AAS_SERVER_PORT, () => {
            this.logger.info(`AAS-Server listening on ${this.variable.AAS_SERVER_PORT}`);
        });
    }

    public notify(data: WebSocketData): void {
        for (const client of this.clients.values()) {
            client.notify(data);
        }
    }

    public close(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.wss.close(error => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    private onConnection = (ws: WebSocket): void => {
        const client = new SocketClient(ws);
        client.on('message', this.onClientMessage);
        client.on('close', this.onClientClose);
        client.on('error', this.onClientError);
        this.clients.add(client);
    };

    private onClose = (): void => {
        this.wss.clients.forEach(ws => ws.close());
        this.wss.off('connection', this.onConnection);
        this.wss.off('close', this.onClose);
        this.wss.off('error', this.onError);
    };

    private onClientClose = (code: number, reason: string, client: SocketClient): void => {
        this.emitter.emit('close', client);

        client.off('message', this.onClientMessage);
        client.off('close', this.onClientClose);
        client.off('error', this.onClientError);

        if (!this.clients.delete(client)) {
            this.logger.error(`Unknown WebSocket client detected.`);
        }
    };

    private onClientMessage = (data: WebSocketData, client: SocketClient): void => {
        this.emitter.emit('message', data, client);
    };

    private onClientError = (error: Error, client: SocketClient): void => {
        this.emitter.emit('error', error, client);
    };

    private onError = (error: Error): void => {
        this.logger.error(`WebSocket server error: ${error?.message}`);
    };

    private readonly shutdownHandler = (signal: unknown): void => {
        this.logger.info(`Caught ${signal}, gracefully shutting down`);
        this.app.online = false;
        container.dispose();

        setTimeout(() => {
            this.logger.info('Shutting down application');
            this.server.close(() => {
                this.logger.info('All requests stopped, shutting down');
                process.exit();
            });
        }, 0);
    };
}
