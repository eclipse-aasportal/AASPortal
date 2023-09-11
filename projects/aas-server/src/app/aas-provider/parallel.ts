/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { EventEmitter } from "events";
import { noop } from "lodash-es";
import { Worker, SHARE_ENV } from "worker_threads";
import fs from 'fs';
import path from 'path';

import { ScanResultType, ScanResult } from "./scan-result.js";
import { WorkerData } from "./worker-data.js";
import { Logger } from "../logging/logger.js";
import { Variable } from '../variable.js';

/** Represents a worker task for scanning a container. */
class WorkerTask extends EventEmitter {
    private _worker?: Worker;

    constructor(data: WorkerData) {
        super();

        this.data = data;
    }

    public readonly data: WorkerData;

    public get worker(): Worker | undefined {
        return this._worker;
    }

    public execute(worker: Worker) {
        this._worker = worker;

        worker.on("message", this.workerOnMessage);
        worker.on("error", this.workerOnError);
        worker.on("exit", this.workerOnExit);
        worker.postMessage(this.data);
    }

    public destroy(): void {
        this.removeAllListeners();
        if (this._worker) {
            this._worker.off("message", this.workerOnMessage);
            this._worker.off("exit", this.workerOnExit);
            this._worker.off("error", this.workerOnError);
        }
    }

    private workerOnMessage = (value: Uint8Array) => {
        const result: ScanResult = JSON.parse(Buffer.from(value).toString());
        if (result.type === ScanResultType.End) {
            this.emit("end", this, result);
        } else {
            this.emit("message", result);
        }
    }

    private workerOnError = (error: Error) => {
        this.emit("error", error, this);
    }

    private workerOnExit = (code: number) => {
        this.emit("exit", code, this);
    }
}

/** Provides a pool of worker threads. */
@singleton()
export class Parallel extends EventEmitter {
    private readonly script: string;
    private readonly waiting = new Array<WorkerTask>();
    private readonly pool = new Map<Worker, boolean>();

    constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(Variable) private readonly variable: Variable
    ) {
        super();
        this.script = path.resolve(this.variable.CONTENT_ROOT ?? './', 'aas-scan-worker.js');
        if (fs.existsSync(this.script)) {
            for (let i = 0; i < this.variable.MAX_WORKERS; i++) {
                this.pool.set(new Worker(this.script, { env: SHARE_ENV }), true);
            }
        } else {
            this.logger.error(`${this.script} does not exist.`);
        }
    }

    /**
     * Executes a new task in parallel.
     * @param data The task data.
     */
    public execute(data: WorkerData): void {
        const task = new WorkerTask(data);
        task.on("message", this.taskOnMessage.bind(this));
        task.on("end", this.taskOnEnd.bind(this));
        task.on("error", this.taskOnError.bind(this));

        const worker = this.nextWorker();
        if (worker) {
            task.execute(worker);
        } else {
            this.waiting.push(task);
        }
    }

    private nextWorker(): Worker | undefined {
        for (const entry of this.pool) {
            if (entry[1] === true) {
                this.pool.set(entry[0], false);
                return entry[0];
            }
        }

        return undefined;
    }

    private taskOnMessage(result: ScanResult) {
        this.emit("message", result);
    }

    private taskOnEnd(task: WorkerTask, result: ScanResult) {
        this.emit("end", result);

        if (task) {
            const worker = task.worker;
            task.destroy();
            if (worker) {
                if (this.waiting.length > 0) {
                    const nextTask = this.waiting.shift();
                    if (nextTask) {
                        nextTask.execute(worker);
                    }
                } else {
                    this.pool.set(worker, true);
                }
            }
        }
    }

    private taskOnError(error: Error, task: WorkerTask): void {
        this.logger.error(error);

        try {
            if (task) {
                task.destroy();
                if (task.worker) {
                    this.pool.delete(task.worker)
                }

                const index = this.waiting.indexOf(task);
                if (index >= 0) {
                    this.waiting.splice(index, 1);
                }

                while (this.pool.size < this.variable.MAX_WORKERS) {
                    this.pool.set(new Worker(this.script, { env: SHARE_ENV }), true);
                }
            }
        }
        catch (error) {
            noop();
        }
    }
}