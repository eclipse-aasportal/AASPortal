/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { singleton } from 'tsyringe';
import { EventEmitter } from 'events';
import { EventListener } from '../types.js';

export interface Task {
    id: number;
    endpointName: string;
    owner: object;
    type: 'ScanEndpoint' | 'ScanTemplates';
    state: 'idle' | 'inProgress';
    start: number;
    end: number;
    handle?: NodeJS.Timeout;
}

@singleton()
export class TaskHandler {
    private readonly eventEmitter = new EventEmitter();
    private readonly _tasks = new Map<number, Task>();
    private nextTaskId = 1;

    public get tasks(): Iterable<Task> {
        return this._tasks.values();
    }

    public on(event: 'empty', handler: EventListener): EventEmitter {
        return this.eventEmitter.on(event, handler);
    }

    public off(event: 'empty', handler: EventListener): EventEmitter {
        return this.eventEmitter.off(event, handler);
    }

    public delete(taskId: number): void {
        const task = this._tasks.get(taskId);
        if (task === undefined) {
            return;
        }

        if (task.handle) {
            clearTimeout(task.handle);
        }

        this._tasks.delete(taskId);
        if (this.empty(task.owner)) {
            this.eventEmitter.emit('empty', task.owner);
        }
    }

    public get(taskId: number): Task | undefined {
        return this._tasks.get(taskId);
    }

    public empty(owner: object): boolean {
        for (const task of this._tasks.values()) {
            if (task.owner === owner) {
                return false;
            }
        }

        return true;
    }

    public createTask(endpointName: string, owner: object, type: 'ScanEndpoint' | 'ScanTemplates'): Task {
        const id = this.nextTaskId;
        ++this.nextTaskId;
        const task: Task = {
            id,
            type,
            endpointName,
            owner,
            state: 'idle',
            start: 0,
            end: 0,
        };

        this._tasks.set(id, task);

        return task;
    }

    public find(endpointName: string, type: 'ScanEndpoint' | 'ScanTemplates'): Task | undefined {
        for (const task of this._tasks.values()) {
            if (task.endpointName === endpointName && type === task.type) {
                return task;
            }
        }

        return undefined;
    }
}
