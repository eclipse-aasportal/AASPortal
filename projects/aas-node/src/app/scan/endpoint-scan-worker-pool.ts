/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton, Disposable } from 'tsyringe';
import { EventEmitter } from 'events';
import { Worker, SHARE_ENV } from 'worker_threads';
import fs from 'fs';
import path from 'path/posix';
import { noop } from 'aas-core';
import { LOGGER } from 'aas-package';

import { CommandData, EventData, isEventData, ResponseData } from '../types.js';
import { Variable } from '../variable.js';
import { AASIndexClient } from '../index/aas-index-client.js';

/**
 * Represents a worker for scanning an endpoint.
 */
class EndpointScanWorker extends EventEmitter {
    private _worker?: Worker;

    public constructor(data: CommandData) {
        super();

        this.data = data;
    }

    public readonly data: CommandData;

    public get worker(): Worker | undefined {
        return this._worker;
    }

    public execute(worker: Worker): void {
        this._worker = worker;
        this._worker.on('message', this.workerOnMessage);
        this._worker.on('error', this.workerOnError);
        this._worker.on('exit', this.workerOnExit);
        this._worker.postMessage(this.data);
    }

    public dispose(): void {
        if (this._worker) {
            this._worker.off('message', this.workerOnMessage);
            this._worker.off('exit', this.workerOnExit);
            this._worker.off('error', this.workerOnError);
            this._worker = undefined;
        }
    }

    private workerOnMessage = (data: EventData | ResponseData): void => {
        if (isEventData(data) && data.name === 'End') {
            this.emit('end', data, this);
        } else {
            this.emit('message', data);
        }
    };

    private workerOnError = (error: Error): void => {
        this.emit('error', error, this);
    };

    private workerOnExit = (code: number): void => {
        this.emit('exit', code, this);
    };
}

/**
 * Provides a pool of worker threads.
 */
@singleton()
export class EndpointScanWorkerPool extends EventEmitter implements Disposable {
    private readonly logger = container.resolve(LOGGER);
    private readonly variable = container.resolve(Variable);
    private readonly index = container.resolve(AASIndexClient);
    private readonly script: string;
    private readonly waiting = new Array<EndpointScanWorker>();
    private readonly pool = new Map<Worker, EndpointScanWorker | null>();

    public constructor() {
        super();

        this.script = path.resolve(this.variable.CONTENT_ROOT, 'aas-scan.js');
        if (!fs.existsSync(this.script)) {
            this.logger.error(`${this.script} does not exist.`);
        }
    }

    /**
     * Executes a new endpoint scan.
     * @param data The task data.
     */
    public execute(data: CommandData): void {
        const task = new EndpointScanWorker(data);
        task.on('message', this.taskOnMessage);
        task.on('end', this.taskOnEnd);
        task.on('exit', this.taskOnExit);
        task.on('error', this.taskOnError);

        const worker = this.nextWorker(task);
        if (worker) {
            task.execute(worker);
        } else {
            this.waiting.push(task);
        }
    }

    /**
     * Cancels a task with the given task ID.
     * @param data The message to cancel the corresponding task.
     * @returns A promise that resolves when the task is canceled or if the task was not found.
     */
    public cancel(taskId: number, endpoint: string): Promise<void> {
        return new Promise<void>(resolve => {
            const index = this.waiting.findIndex(item => item.data.args.taskId === taskId);
            if (index >= 0) {
                const task = this.waiting[index];
                this.waiting.splice(index, 1);
                this.destroyTask(task);
                return resolve();
            }

            const task = [...this.pool.values()].find(item => item?.data.args.taskId === taskId);
            if (!task?.worker) {
                return resolve();
            }

            task.once('end', () => {
                resolve();
            });

            task.worker.postMessage({
                application: 'ScanApp',
                type: 'command',
                name: 'CancelScan',
                args: { taskId, endpoint },
            } satisfies CommandData);
        });
    }

    /**
     * Disposes all worker threads and clears the pool.
     * @returns A promise that resolves when all workers have been terminated.
     */
    public async dispose(): Promise<void> {
        await Promise.allSettled(
            [...this.pool].filter(([, task]) => task !== null).map(([worker]) => worker.terminate()),
        );
    }

    private nextWorker(task: EndpointScanWorker): Worker | undefined {
        for (const [worker, data] of this.pool) {
            if (data === null) {
                this.pool.set(worker, task);
                return worker;
            }
        }

        if (this.pool.size < this.variable.MAX_WORKERS) {
            const workerName = `ScanApp Worker ${this.pool.size + 1}`;
            const worker = new Worker(this.script, { env: SHARE_ENV, name: workerName });
            this.pool.set(worker, task);
            const { port1, port2 } = new MessageChannel();
            this.index.connect(port1);
            worker.postMessage(
                {
                    application: 'ScanApp',
                    type: 'command',
                    name: 'connect',
                    args: { port: port2, name: workerName },
                } satisfies CommandData,
                [port2],
            );

            return worker;
        }

        return undefined;
    }

    private taskOnMessage = (data: ResponseData): void => {
        this.emit('message', data);
    };

    private taskOnEnd = (data: EventData, task: EndpointScanWorker): void => {
        const worker = task.worker;
        task.off('message', this.taskOnMessage);
        task.off('end', this.taskOnEnd);
        task.off('exit', this.taskOnExit);
        task.off('error', this.taskOnError);
        task.dispose();
        if (worker) {
            if (this.waiting.length > 0) {
                const nextTask = this.waiting.shift();
                if (nextTask) {
                    nextTask.execute(worker);
                }
            } else {
                this.pool.set(worker, null);
            }
        }

        this.emit('end', data);
    };

    private readonly taskOnExit = (code: number, task: EndpointScanWorker): void => {
        this.logger.info(`Task ${task.data.args.taskId} exited with code ${code}.`);
        if (!task) {
            return;
        }

        this.destroyTask(task);
    };

    private readonly taskOnError = (error: Error, task: EndpointScanWorker): void => {
        this.logger.error(error);
        if (!task) {
            return;
        }

        this.destroyTask(task);
    };

    private destroyTask(task: EndpointScanWorker): void {
        try {
            task.off('message', this.taskOnMessage);
            task.off('end', this.taskOnEnd);
            task.off('exit', this.taskOnExit);
            task.off('error', this.taskOnError);
            task.dispose();
            if (task.worker) {
                this.pool.delete(task.worker);
            }

            const index = this.waiting.indexOf(task);
            if (index >= 0) {
                this.waiting.splice(index, 1);
            }
        } catch {
            noop();
        }
    }
}
