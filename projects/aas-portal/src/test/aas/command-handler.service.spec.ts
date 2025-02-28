/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { Command } from '../../app/types/command';
import { noop } from 'rxjs';
import { NotifyService } from 'aas-lib';
import { CommandHandlerService } from '../../app/aas/command-handler.service';

class TestCommand extends Command {
    public constructor(
        private spy?: jasmine.Spy,
        private undoSpy?: jasmine.Spy,
        private redoSpy?: jasmine.Spy,
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
    public constructor(private abortSpy: jasmine.Spy) {
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

describe('CommandHandlerService', () => {
    let service: CommandHandlerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [],
            providers: [
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error']),
                },
            ],
            imports: [],
        });

        service = TestBed.inject(CommandHandlerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('indicates that undo is not possible', () => {
        expect(service.canUndo()).toBeFalse();
    });

    it('indicates that redo is not possible', () => {
        expect(service.canRedo()).toBeFalse();
    });

    it('can execute a command', () => {
        const spy = jasmine.createSpy('execute');
        service.execute(new TestCommand(spy));
        expect(spy).toHaveBeenCalled();
    });

    it('can undo/redo a command', () => {
        const undoSpy = jasmine.createSpy('undo');
        const redoSpy = jasmine.createSpy('redo');
        service.execute(new TestCommand(undefined, undoSpy, redoSpy));
        expect(service.canUndo()).toBeTrue();
        service.undo();
        expect(undoSpy).toHaveBeenCalled();
        expect(service.canRedo()).toBeTrue();
        service.redo();
        expect(redoSpy).toHaveBeenCalled();
    });

    it('clears the undo/redo stack', () => {
        service.execute(new TestCommand());
        service.execute(new TestCommand());
        service.clear();
        expect(service.canUndo()).toBeFalse();
        expect(service.canRedo()).toBeFalse();
    });

    it('aborts a failed command', () => {
        const abortSpy = jasmine.createSpy('abort');
        expect(() => service.execute(new FailCommand(abortSpy))).toThrowError();
        expect(abortSpy).toHaveBeenCalled();
    });
});