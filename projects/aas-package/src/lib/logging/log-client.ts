/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import net from 'net';
import { Logger, LogLevel, LogMessage } from './logger.js';
import { Disposable } from 'tsyringe';
import { LogHost, startLogHost } from './log-host.js';

const MAX_PENDING = 100;

export class LogClient implements Logger, Disposable {
    private socket?: net.Socket;
    private host?: LogHost;
    private pending: LogMessage[] = [];
    private readonly logLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'Info';

    public constructor(endpoint: string, startHost: boolean = false) {
        this.connect(endpoint, startHost).then(socket => {
            this.socket = socket;
            this.socket.setEncoding('utf8');

            if (this.pending.length > 0) {
                for (const msg of this.pending) {
                    this.send(msg);
                }

                this.pending = [];
            }
        });
    }

    public info(message: string): void {
        if (!message || !this.shouldLog('Info')) {
            return;
        }

        this.send({ type: 'Info', text: message, timestamp: Date.now(), pid: process.pid });
    }

    public warning(message: string): void {
        if (!message || !this.shouldLog('Warning')) {
            return;
        }

        this.send({ type: 'Warning', text: message, timestamp: Date.now(), pid: process.pid });
    }

    public error(error: Error | string): void {
        if (!error || !this.shouldLog('Error')) {
            return;
        }

        const message = typeof error === 'string' ? error : error.stack || error.message || String(error);
        this.send({ type: 'Error', text: message, timestamp: Date.now(), pid: process.pid });
    }

    public dispose(): void {
        this.socket?.end();
        this.host?.stop();
    }

    private shouldLog(level: LogLevel): boolean {
        const order: Record<LogLevel, number> = { Error: 0, Warning: 1, Info: 2 };
        return order[level] <= order[this.logLevel];
    }

    private send(msg: LogMessage): Promise<void> {
        return new Promise<void>(resolve => {
            if (!this.socket) {
                if (this.pending.length >= MAX_PENDING) {
                    this.pending.shift();
                }

                this.pending.push(msg);
                return resolve();
            }

            this.socket.write(JSON.stringify(msg) + '\n');
            resolve();
        });
    }

    private async connect(endpoint: string, createServer: boolean): Promise<net.Socket> {
        if (createServer) {
            this.host = await startLogHost(endpoint);
        }

        return await new Promise(resolve => {
            const socket = net.connect(endpoint);
            socket.once('connect', () => {
                socket.removeAllListeners('error');
                resolve(socket);
            });
        });
    }
}
