/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, computed, inject, signal } from '@angular/core';
import { Command } from './command';
import { NotifyService } from '../core/notify/notify.service';

@Injectable({
    providedIn: 'root',
})
export class CommandHandler {
    private readonly notify = inject(NotifyService);
    private readonly commands = signal<Command[]>([]);
    private readonly position = signal(-1);

    public execute(command: Command): void {
        if (!command) {
            throw new Error('Argument command is undefined.');
        }

        try {
            command.execute();

            if (this.commands().length > 0 && this.position() < this.commands().length - 1) {
                this.commands.update(values => values.filter((_, i) => i <= this.position()));
            }

            this.commands.update(values => [...values, command]);
            this.position.update(value => value + 1);
        } catch (error) {
            command.abort();
            throw error;
        }
    }

    public readonly canUndo = computed(() => this.position() >= 0);

    public readonly canRedo = computed(() => this.position() + 1 < this.commands().length);

    public undo(): void {
        try {
            this.commands()[this.position()].undo();
            this.position.update(value => value - 1);
        } catch (error) {
            this.notify.error(error);
        }
    }

    public redo(): void {
        try {
            this.position.update(value => value + 1);
            this.commands()[this.position()].redo();
        } catch (error) {
            this.notify.error(error);
        }
    }

    public clear(): void {
        this.commands.set([]);
        this.position.set(-1);
    }
}
