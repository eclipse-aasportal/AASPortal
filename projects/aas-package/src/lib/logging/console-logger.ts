/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Worker } from 'node:worker_threads';
import { Logger, LogLevel } from './logger.js';

interface LoggerMessage {
    level: LogLevel;
    message: string;
}

/** Provides a logger that writes messages to `stdout` and `stderr`. */
export class ConsoleLogger extends Logger {
    private worker?: Worker;

    public constructor(logLevel: LogLevel, isMainLogger = false) {
        super(logLevel);

        if (isMainLogger) {
            this.startWorker();
        }
    }

    public override error(error: Error | string): Promise<void> {
        if (!this.shouldLog('Error')) {
            return Promise.resolve();
        }

        const message = typeof error === 'string' ? error : error.stack || error.message || String(error);
        return this.postMessage({ level: 'Error', message });
    }

    public override warning(message: string): Promise<void> {
        if (!this.shouldLog('Warning')) {
            return Promise.resolve();
        }

        return this.postMessage({ level: 'Warning', message });
    }

    public override info(message: string): Promise<void> {
        if (!this.shouldLog('Info')) {
            return Promise.resolve();
        }

        return this.postMessage({ level: 'Info', message });
    }

    private startWorker(): void {
        try {
            const workerCode = `
                (async () => {
                    const { parentPort } = await import('node:worker_threads');
                    const handler = msg => {
                        if (!msg || typeof msg !== 'object') return;
                        const level = msg.level;
                        const message = msg.message;
                        switch (level) {
                            case 'Error':
                                console.error(getDateTime() + " [Error]: " + String(message));
                                break;
                            case 'Warning':
                                console.warn(getDateTime() + " [Warning]: " + String(message));
                                break;
                            case 'Info':
                            default:
                                console.info(getDateTime() + " [Info]: " + String(message));
                                break;
                        }

                        function getDateTime() {
                            const value = new Date().toISOString().replace('T', ' ');
                            return value.substring(0, value.lastIndexOf('.'));
                        }
                    }

                    parentPort.on('message', handler);
                })();
            `;

            this.worker = new Worker(workerCode, { eval: true });
            this.worker.on('error', (err: unknown) => {
                console.error('Logger worker error:', err);
            });

            const terminate = (): void => {
                if (this.worker) {
                    this.worker.terminate?.();
                    this.worker = undefined;
                }
            };

            process.on('beforeExit', terminate);
            process.on('exit', terminate);
        } catch (e) {
            console.error('Failed to initialize logger worker:', e);
            this.worker = undefined;
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const order: Record<LogLevel, number> = { Error: 0, Warning: 1, Info: 2 };
        return order[level] <= order[this.logLevel];
    }

    private async postMessage(message: LoggerMessage): Promise<void> {
        if (this.worker) {
            this.worker.postMessage(message);
        } else {
            switch (message.level) {
                case 'Error':
                    console.error(this.getDateTime() + ' [Error]: ' + message.message);
                    break;
                case 'Warning':
                    console.warn(this.getDateTime() + ' [Warning]: ' + message.message);
                    break;
                case 'Info':
                default:
                    console.info(this.getDateTime() + ' [Info]: ' + message.message);
                    break;
            }
        }
    }

    private getDateTime(): string {
        const value = new Date().toISOString().replace('T', ' ');
        return value.substring(0, value.lastIndexOf('.'));
    }
}
