/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { noop } from 'aas-core';
import { Command } from '../../lib/services/command';
import { CommandHandler } from '../../lib/services/command-handler';
import { createSpyObj } from '../../../../aas-portal/src/test/mocks';
import { NotifyService } from '../../lib/components/notify/notify.service';

class TestCommand extends Command {
    public constructor(
        private spy?: jest.Mock,
        private undoSpy?: jest.Mock,
        private redoSpy?: jest.Mock,
    ) {
        super('TestCommand');
    }

    protected onExecute(): void {
        if (this.spy) {
            this.spy();
        }
    }

    protected onUndo(): void {
        if (this.undoSpy) {
            this.undoSpy();
        }
    }

    protected onRedo(): void {
        if (this.redoSpy) {
            this.redoSpy();
        }
    }

    protected onAbort(): void {
        noop();
    }
}

class FailCommand extends Command {
    public constructor(private abortSpy: jest.Mock) {
        super('TestCommand');
    }

    protected onExecute(): void {
        throw new Error('Command throws an error.');
    }

    protected onUndo(): void {
        noop();
    }

    protected onRedo(): void {
        noop();
    }

    protected onAbort(): void {
        this.abortSpy();
    }
}

describe('CommandHandler', () => {
    let service: CommandHandler;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [],
            providers: [
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error']),
                },
                provideZonelessChangeDetection(),
            ],
        });

        service = TestBed.inject(CommandHandler);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('indicates that undo is not possible', () => {
        expect(service.canUndo()).toBe(false);
    });

    it('indicates that redo is not possible', () => {
        expect(service.canRedo()).toBe(false);
    });

    it('can execute a command', () => {
        const spy = jest.fn();
        service.execute(new TestCommand(spy));
        expect(spy).toHaveBeenCalled();
    });

    it('can undo/redo a command', () => {
        const undoSpy = jest.fn();
        const redoSpy = jest.fn();
        service.execute(new TestCommand(undefined, undoSpy, redoSpy));
        expect(service.canUndo()).toBe(true);
        service.undo();
        expect(undoSpy).toHaveBeenCalled();
        expect(service.canRedo()).toBe(true);
        service.redo();
        expect(redoSpy).toHaveBeenCalled();
    });

    it('clears the undo/redo stack', () => {
        service.execute(new TestCommand());
        service.execute(new TestCommand());
        service.clear();
        expect(service.canUndo()).toBe(false);
        expect(service.canRedo()).toBe(false);
    });

    it('aborts a failed command', () => {
        const abortSpy = jest.fn();
        expect(() => service.execute(new FailCommand(abortSpy))).toThrow();
        expect(abortSpy).toHaveBeenCalled();
    });
});
