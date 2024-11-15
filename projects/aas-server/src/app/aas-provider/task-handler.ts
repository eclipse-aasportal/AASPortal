/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { singleton } from 'tsyringe';

export interface Task {
    id: number;
    endpointName: string;
    owner: object;
    type: 'ScanEndpoint' | 'ScanTemplates';
    state: 'idle' | 'inProgress';
    start: number;
    end: number;
}

@singleton()
export class TaskHandler {
    private readonly tasks = new Map<number, Task>();
    private nextTaskId = 1;

    public delete(taskId: number): void {
        this.tasks.delete(taskId);
    }

    public get(taskId: number): Task | undefined {
        return this.tasks.get(taskId);
    }

    public set(task: Task) {
        this.tasks.set(task.id, task);
    }

    public empty(owner: object, name?: string): boolean {
        for (const task of this.tasks.values()) {
            if (task.owner === owner && (!name || task.endpointName === name)) {
                return false;
            }
        }

        return true;
    }

    public createTask(endpointName: string, owner: object, type: 'ScanEndpoint' | 'ScanTemplates'): Task {
        const id = this.nextTaskId;
        ++this.nextTaskId;
        return {
            id,
            type,
            endpointName,
            owner,
            state: 'idle',
            start: 0,
            end: 0,
        };
    }

    public find(endpointName: string, type: 'ScanEndpoint' | 'ScanTemplates'): Task | undefined {
        for (const task of this.tasks.values()) {
            if (task.endpointName === endpointName && type === task.type) {
                return task;
            }
        }

        return undefined;
    }
}
