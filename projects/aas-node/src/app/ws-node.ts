/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import https from 'https';
import { WebSocketData } from 'aas-core';
import EventEmitter from 'events';
import fs from 'fs';

import { App } from './app.js';
import { Variable } from './variable.js';
import { SocketClient } from './live/socket-client.js';
import { Logger } from './logging/logger.js';

/* istanbul ignore next */
@singleton()
export class WSNode extends EventEmitter {
    private readonly wss: WebSocketServer;
    private readonly clients: Set<SocketClient> = new Set<SocketClient>();
    private readonly server: http.Server | https.Server;

    public constructor(
        @inject(App) app: App,
        @inject(Variable) private readonly variable: Variable,
        @inject('Logger') private readonly logger: Logger,
    ) {
        super();

        if (this.variable.HTTPS_KEY_FILE && this.variable.HTTPS_CERT_FILE) {
            this.server = https.createServer({
                key: fs.readFileSync(this.variable.HTTPS_KEY_FILE),
                cert: fs.readFileSync(this.variable.HTTPS_CERT_FILE),
            });
        } else if (this.variable.HTTPS_PFX_FILE) {
            this.server = https.createServer({
                pfx: fs.readFileSync(this.variable.HTTPS_PFX_FILE),
                passphrase: this.variable.AAS_NODE_PASSWORD,
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

    public run(): void {
        process.on('SIGTERM', () => {
            this.logger.info('Shutting down AASNode');
            this.server.close(() => {
                this.logger.info('HTTP server closed.');
                process.exit(0);
            });
        });

        this.server.listen(this.variable.AAS_NODE_PORT, () => {
            this.logger.info(`AAS-Server listening on ${this.variable.AAS_NODE_PORT}`);
        });
    }

    public notify(name: string, data: WebSocketData): void {
        for (const client of this.clients.values()) {
            if (client.has(name)) {
                client.notify(data);
            }
        }
    }

    public close(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.clients.forEach(client => client.close());
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

    private onError = (error: Error): void => {
        this.logger.error(`WebSocket server error: ${error?.message}`);
    };

    private onClientClose = (code: number, reason: string, client: SocketClient): void => {
        this.emit('close', client);

        client.off('message', this.onClientMessage);
        client.off('close', this.onClientClose);
        client.off('error', this.onClientError);

        if (!this.clients.delete(client)) {
            this.logger.error(`Unknown WebSocket client detected.`);
        }
    };

    private onClientMessage = (data: WebSocketData, client: SocketClient): void => {
        this.emit('message', data, client);
    };

    private onClientError = (error: Error, client: SocketClient): void => {
        this.emit('error', error, client);
    };
}
