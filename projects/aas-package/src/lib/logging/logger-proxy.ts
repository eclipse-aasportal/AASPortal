/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton, Disposable } from 'tsyringe';
import { isMainThread, SHARE_ENV, Worker, MessageChannel, MessagePort } from 'worker_threads';
import { Logger, LOGGER_SCRIPT } from './logger.js';
import { CommandData, Connectable, isResponseData, WorkerData } from '../types.js';

@singleton()
export class LoggerProxy implements Logger, Disposable, Connectable {
    private readonly worker?: Worker;
    private readonly pendingMessages: CommandData[] = [];
    private port?: MessagePort;

    public constructor() {
        if (isMainThread) {
            const { port1, port2 } = new MessageChannel();
            this.port = port2;
            const name = 'Logger Worker';
            this.worker = new Worker(container.resolve(LOGGER_SCRIPT), { env: SHARE_ENV, name });
            this.worker.on('error', this.onWorkerError);
            this.worker.on('message', this.onWorkerMessage);
            this.connect(port1, name);
        }
    }

    public connect(port: MessagePort, name?: string): void {
        if (this.worker) {
            this.worker.postMessage(
                {
                    type: 'command',
                    name: 'ConnectLogger',
                    args: { port, name },
                } satisfies CommandData,
                [port],
            );
        } else {
            if (this.port) {
                throw new Error('LoggerProxy already connected to a port.');
            }

            this.port = port;
            if (this.pendingMessages.length > 0) {
                for (const msg of this.pendingMessages) {
                    this.port.postMessage(msg);
                }

                this.pendingMessages.length = 0;
            }
        }
    }

    public error(error: Error | string): void {
        this.postMessage({
            type: 'command',
            name: 'Error',
            args: typeof error === 'string' ? { message: error } : { message: error.message, stack: error.stack },
        });
    }

    public warning(message: string): void {
        this.postMessage({ type: 'command', name: 'Warning', args: { message } });
    }

    public info(message: string): void {
        this.postMessage({ type: 'command', name: 'Info', args: { message } });
    }

    public dispose(): Promise<void> | void {
        if (this.worker) {
            this.worker.off('error', this.onWorkerError);
            this.worker.off('message', this.onWorkerMessage);
            this.worker.terminate();
        }

        if (this.port) {
            this.port.removeAllListeners();
            this.port.close();
            this.port = undefined;
        }
    }

    private postMessage(message: CommandData): void {
        if (this.port) {
            this.port.postMessage(message);
        } else {
            this.pendingMessages.push(message);
        }
    }

    private readonly onWorkerMessage = (data: WorkerData): void => {
        if (isResponseData(data)) {
            if (data.command === 'shutdown') {
                this.worker?.terminate();
            }
        }
    };

    private readonly onWorkerError = (error: unknown): void => {
        console.error(error);
    };
}
