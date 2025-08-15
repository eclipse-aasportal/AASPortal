/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { signal, WritableSignal } from "@angular/core";

/**
 * Represents the state of a child component.
 */
export abstract class ChildState<TState> {
    private _initialized = false;
    protected constructor(initialState: TState) {
        this.state = signal(initialState);
    }

    /** Indicates whether the current instance is initialized. */
    public get initialized(): boolean {
        return this._initialized;
    }

    /** The current state. */
    public readonly state: WritableSignal<TState>;

    /**
     * Initializes the state of a child component. Only the first call has an effect, further calls will be ignored.
     * @param state The initial state.
     */
    public initialize(state: TState | undefined): void {
        if (this._initialized) {
            return;
        }

        this.initializing(state);
        this._initialized = true;
    }

    /**
     * Updates the state of the child component.
     * @param newState The new state.
     */
    public update(newState: Partial<TState>) : void {
        this.state.set(this.updating(newState));
        this._initialized = true;
    }

    /** In a derived class, the state of the child component is initialized.  */
    protected abstract initializing(state: TState | undefined): void;

    /** In a derived class, the state of the child component is upadted. */
    protected abstract updating(newState: Partial<TState>): TState;
}