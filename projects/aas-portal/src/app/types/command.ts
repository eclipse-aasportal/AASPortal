/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, isIdentifiable } from 'aas-core';

enum CommandState {
    Idle,
    Executed,
    Aborted,
}

/** Abstract base implementation of a command. */
export abstract class Command {
    private state: CommandState = CommandState.Idle;

    /**
     * @param name The command name.
     */
    protected constructor(public readonly name: string) {}

    public execute(): void {
        if (this.state !== CommandState.Idle) {
            throw new Error('Invalid command state.');
        }

        this.onExecute();
        this.state = CommandState.Executed;
    }

    public undo(): void {
        if (this.state !== CommandState.Executed) {
            throw new Error('Invalid command state.');
        }

        this.onUndo();
    }

    public redo(): void {
        if (this.state !== CommandState.Executed) {
            throw new Error('Invalid command state.');
        }

        this.onRedo();
    }

    public abort() {
        if (this.state !== CommandState.Idle) {
            throw new Error('Invalid command state.');
        }

        this.onAbort();
    }

    protected abstract onExecute(): void;

    protected abstract onUndo(): void;

    protected abstract onRedo(): void;

    protected abstract onAbort(): void;

    protected createReference(referable: aas.Referable): aas.Reference {
        let reference: aas.Reference | undefined;
        if (isIdentifiable(referable)) {
            reference = {
                type: 'ModelReference',
                keys: [
                    {
                        value: referable.id,
                        type: referable.modelType as aas.KeyTypes,
                    },
                ],
            };
        } else if (referable.parent) {
            reference = {
                type: 'ModelReference',
                keys: [
                    ...referable.parent.keys.map(key => ({ ...key })),
                    {
                        type: referable.modelType as aas.KeyTypes,
                        value: referable.idShort,
                    },
                ],
            };
        }

        if (!reference) {
            throw new Error(`${referable.idShort} is not referable.`);
        }

        return reference;
    }
}
