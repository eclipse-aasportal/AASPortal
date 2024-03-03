import { singleton } from 'tsyringe';

export interface Task {
    id: string;
    owner: string;
    type: 'ScanContainer' | 'ScanTemplates';
}

@singleton()
export class TaskHandler {
    private readonly tasks = new Map<number, Task>();

    private nextTaskId = 1;

    public delete(taskId: number): void {
        this.tasks.delete(taskId);
    }

    public get(taskId: number): Task {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error('Invalid operation.');
        }

        return task;
    }

    public set(taskId: number, task: Task) {
        this.tasks.set(taskId, task);
    }

    public clear(owner: string): void {
        [...this.tasks].filter(item => item[1].owner === owner).forEach(item => this.tasks.delete(item[0]));
    }

    public createTaskId(): number {
        const taskId = this.nextTaskId;
        ++this.nextTaskId;
        return taskId;
    }
}
