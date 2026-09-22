/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, vi, afterEach } from 'vitest';
import { TaskHandler } from './task-handler';

describe('TaskHandler', () => {
    let taskHandler: TaskHandler;

    beforeEach(() => {
        taskHandler = new TaskHandler();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be created', () => {
        expect(taskHandler).toBeInstanceOf(TaskHandler);
    });

    it('creates tasks with sequential IDs and their initial state', () => {
        const owner = {};

        const firstTask = taskHandler.createTask('Import package', owner, 'import');
        const secondTask = taskHandler.createTask('Export package', owner, 'export');

        expect(firstTask).toMatchObject({
            id: 1,
            name: 'Import package',
            owner,
            type: 'import',
            state: 'idle',
            start: 0,
            end: 0,
        });
        expect(secondTask.id).toBe(2);
        expect(taskHandler.get(firstTask.id)).toBe(firstTask);
    });

    it('returns all created tasks through the tasks iterable', () => {
        const owner = {};
        const firstTask = taskHandler.createTask('Import package', owner, 'import');
        const secondTask = taskHandler.createTask('Export package', owner, 'export');

        expect([...taskHandler.tasks]).toEqual([firstTask, secondTask]);
    });

    it('finds a task only when both its name and type match', () => {
        const owner = {};
        const importTask = taskHandler.createTask('Package', owner, 'import');
        taskHandler.createTask('Package', owner, 'export');

        expect(taskHandler.find('Package', 'import')).toBe(importTask);
        expect(taskHandler.find('Package', 'scan')).toBeUndefined();
        expect(taskHandler.find('Unknown', 'import')).toBeUndefined();
    });

    it('cancels a task timer and removes the task', () => {
        vi.useFakeTimers();
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
        const task = taskHandler.createTask('Import package', {}, 'import');
        task.handle = setTimeout(() => undefined, 1_000);

        taskHandler.delete(task.id);

        expect(clearTimeoutSpy).toHaveBeenCalledWith(task.handle);
        expect(taskHandler.get(task.id)).toBeUndefined();
        expect([...taskHandler.tasks]).toEqual([]);
    });

    it('does nothing when deleting an unknown task', () => {
        expect(() => taskHandler.delete(99)).not.toThrow();
        expect([...taskHandler.tasks]).toEqual([]);
    });
});
