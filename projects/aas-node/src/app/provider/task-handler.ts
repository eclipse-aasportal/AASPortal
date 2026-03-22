/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { singleton } from 'tsyringe';

export interface Task {
    id: number;
    endpointName: string;
    owner: object;
    type: 'ScanEndpoint';
    state: 'idle' | 'inProgress';
    start: number;
    end: number;
    handle?: NodeJS.Timeout;
}

@singleton()
export class TaskHandler {
    private readonly _tasks = new Map<number, Task>();
    private nextTaskId = 1;

    public get tasks(): Iterable<Task> {
        return this._tasks.values();
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
    }

    public get(taskId: number): Task | undefined {
        return this._tasks.get(taskId);
    }

    public createTask(endpointName: string, owner: object, type: 'ScanEndpoint'): Task {
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

    public find(endpointName: string, type: 'ScanEndpoint'): Task | undefined {
        for (const task of this._tasks.values()) {
            if (task.endpointName === endpointName && type === task.type) {
                return task;
            }
        }

        return undefined;
    }
}
