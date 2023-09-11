/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from "@angular/core";
import { NotifyService } from "aas-lib";
import { Command } from "../types/command";

@Injectable({
    providedIn: 'root'
})
export class CommandHandlerService {
    private commands: Array<Command> = [];
    private position = -1;

    constructor(private notify: NotifyService) {
    }

    public execute(command: Command): void {
        if (!command) {
            throw new Error("Argument command is undefined.");
        }

        try {
            command.execute();

            if (this.commands.length > 0 && this.position < this.commands.length - 1) {
                this.commands.splice(this.position + 1);
            }

            this.commands.push(command);
            ++this.position;
        } catch (error) {
            command.abort();
            throw error;
        }
    }

    public get canUndo(): boolean {
        return this.position >= 0;
    }

    public get canRedo(): boolean {
        return this.position + 1 < this.commands.length
    }

    public undo(): void {
        try {
            this.commands[this.position].undo();
            --this.position;
        }
        catch (error) {
            this.notify.error(error);
        }
    }

    public redo(): void {
        try {
            ++this.position;
            this.commands[this.position].redo();
        }
        catch (error) {
            this.notify.error(error);
        }
    }

    public clear(): void {
        this.commands = [];
        this.position = -1;
    }
}