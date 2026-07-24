/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { EventEmitter } from 'events';
import { Worker, SHARE_ENV } from 'worker_threads';
import fs from 'fs';
import path from 'path/posix';
import { noop } from 'aas-core';
import { LOGGER, Logger } from 'aas-package';

import { EndpointScanMessage, WorkerData } from '../types.js';
import { Variable } from '../variable.js';

/** Represents a worker task for scanning an endpoint. */
class WorkerTask extends EventEmitter {
    private _worker?: Worker;

    public constructor(data: WorkerData) {
        super();

        this.data = data;
    }

    public readonly data: WorkerData;

    public get worker(): Worker | undefined {
        return this._worker;
    }

    public execute(worker: Worker): void {
        this._worker = worker;
        worker.on('message', this.workerOnMessage);
        worker.on('error', this.workerOnError);
        worker.on('exit', this.workerOnExit);
        worker.postMessage(this.data);
    }

    public destroy(): void {
        if (this._worker) {
            this._worker.off('message', this.workerOnMessage);
            this._worker.off('exit', this.workerOnExit);
            this._worker.off('error', this.workerOnError);
            this._worker = undefined;
        }
    }

    private workerOnMessage = (value: Uint8Array): void => {
        const message: EndpointScanMessage = JSON.parse(Buffer.from(value).toString());
        switch (message.kind) {
            case 'End':
                this.emit('end', message, this);
                break;
            default:
                this.emit('message', message);
                break;
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
export class Parallel extends EventEmitter {
    private readonly script: string;
    private readonly waiting = new Array<WorkerTask>();
    private readonly pool = new Map<Worker, WorkerTask | null>();

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(Variable) private readonly variable: Variable,
    ) {
        super();

        this.script = path.resolve(this.variable.CONTENT_ROOT, 'aas-scan.js');
        if (!fs.existsSync(this.script)) {
            this.logger.error(`${this.script} does not exist.`);
        }
    }

    /**
     * Executes a new task in parallel.
     * @param data The task data.
     */
    public execute(data: WorkerData): void {
        const task = new WorkerTask(data);
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
    public cancel(data: WorkerData): Promise<void> {
        return new Promise<void>(resolve => {
            const index = this.waiting.findIndex(item => item.data.taskId === data.taskId);
            if (index >= 0) {
                const task = this.waiting[index];
                this.waiting.splice(index, 1);
                this.destroyTask(task);
                return resolve();
            }

            const task = [...this.pool.values()].find(item => item?.data.taskId === data.taskId);
            if (!task?.worker) {
                return resolve();
            }

            task.worker.postMessage(data);
            task.once('end', () => resolve());
        });
    }

    /**
     * Terminates all worker threads and clears the pool.
     * @returns A promise that resolves when all workers have been terminated.
     */
    public async terminate(): Promise<void> {
        await Promise.allSettled(
            [...this.pool].filter(([, task]) => task !== null).map(([worker]) => worker.terminate()),
        );
    }

    private nextWorker(task: WorkerTask): Worker | undefined {
        for (const [worker, t] of this.pool) {
            if (t === null) {
                this.pool.set(worker, task);
                return worker;
            }
        }

        if (this.pool.size < this.variable.MAX_WORKERS) {
            const worker = new Worker(this.script, { env: SHARE_ENV });
            this.pool.set(worker, task);
            return worker;
        }

        return undefined;
    }

    private taskOnMessage = (result: EndpointScanMessage): void => {
        this.emit('message', result);
    };

    private taskOnEnd = (result: EndpointScanMessage, task: WorkerTask): void => {
        this.emit('end', result);

        if (!task) {
            return;
        }

        const worker = task.worker;
        task.off('message', this.taskOnMessage);
        task.off('end', this.taskOnEnd);
        task.off('exit', this.taskOnExit);
        task.off('error', this.taskOnError);
        task.destroy();
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
    };

    private readonly taskOnExit = (code: number, task: WorkerTask): void => {
        this.logger.info(`Task ${task.data.taskId} exited with code ${code}.`);
        if (!task) {
            return;
        }

        this.destroyTask(task);
    };

    private readonly taskOnError = (error: Error, task: WorkerTask): void => {
        this.logger.error(error);
        if (!task) {
            return;
        }

        this.destroyTask(task);
    };

    private destroyTask(task: WorkerTask): void {
        try {
            task.off('message', this.taskOnMessage);
            task.off('end', this.taskOnEnd);
            task.off('exit', this.taskOnExit);
            task.off('error', this.taskOnError);
            task.destroy();
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
