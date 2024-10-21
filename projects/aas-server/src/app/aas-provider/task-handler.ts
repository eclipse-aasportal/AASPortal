/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { singleton } from 'tsyringe';

export interface Task {
    endpointName: string;
    owner: object;
    type: 'ScanEndpoint' | 'ScanTemplates';
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

    public set(taskId: number, task: Task) {
        this.tasks.set(taskId, task);
    }

    public empty(owner: object, name?: string): boolean {
        for (const task of this.tasks.values()) {
            if (task.owner === owner && (!name || task.endpointName === name)) {
                return false;
            }
        }

        return true;
    }

    public createTaskId(): number {
        const taskId = this.nextTaskId;
        ++this.nextTaskId;
        return taskId;
    }
}
