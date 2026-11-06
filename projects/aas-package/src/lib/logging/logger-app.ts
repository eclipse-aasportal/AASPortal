/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, Disposable, singleton } from 'tsyringe';
import { parentPort, MessagePort } from 'worker_threads';
import { CommandData, ErrorData, isCommandData, ResponseData, WorkerData } from '../types.js';
import { LOGGER } from './logger.js';

@singleton()
export class LoggerApp implements Disposable {
    private readonly ports: MessagePort[] = [];
    private readonly logger = container.resolve(LOGGER);

    public constructor() {
        parentPort?.on('message', this.parentPortOnMessage);
    }

    public dispose(): Promise<void> | void {
        this.ports.forEach(port => {
            port.removeAllListeners('message');
            port.close();
        });

        this.ports.length = 0;
        parentPort?.off('message', this.parentPortOnMessage);
    }

    private readonly parentPortOnMessage = (data: WorkerData): void => {
        try {
            if (isCommandData(data)) {
                if (data.name === 'ConnectLogger') {
                    const port = data.args.port as MessagePort;
                    port.on('message', this.onMessage);
                    this.ports.push(port);
                } else if (data.name === 'shutdown') {
                    this.ports.forEach(port => {
                        port.removeAllListeners('message');
                        port.close();
                    });

                    this.ports.length = 0;
                    parentPort?.postMessage({
                        type: 'response',
                        command: 'shutdown',
                        result: 'LoggerApp shutdown complete.',
                    } satisfies ResponseData);

                    process.exit(0);
                }
            }
        } catch (error) {
            parentPort?.postMessage({
                type: 'error',
                message: error.message,
                stack: error.stack,
            } satisfies ErrorData);
        }
    };

    private readonly onMessage = (data: CommandData): void => {
        if (data.name === 'Error') {
            this.logger.error(String(data.args.stack ?? data.args.message));
        } else if (data.name === 'Warning') {
            this.logger.warning(String(data.args.message));
        } else {
            this.logger.info(String(data.args.message));
        }
    };
}
