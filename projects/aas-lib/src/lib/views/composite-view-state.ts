/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Signal, signal, WritableSignal } from '@angular/core';
import { AASDocument } from 'aas-core';
import { ViewRouteMap } from '../types';

export interface CompositeViewData {
    tuples: [AASDocument, ViewRouteMap][];
}

export abstract class CompositeViewState<TData extends CompositeViewData> {
    private readonly tuples$: WritableSignal<[AASDocument, ViewRouteMap][]>;

    protected constructor(initialState: CompositeViewData) {
        this.tuples$ = signal(initialState.tuples);
        this.tuples = this.tuples$.asReadonly();
    }

    public readonly tuples: Signal<[AASDocument, ViewRouteMap][]>;

    public update(newState: Partial<TData>): void {
        const tuples = (newState as CompositeViewData).tuples;
        if (tuples !== null) {
            this.tuples$.set(tuples);
        }

        this.updating(newState);
    }

    protected abstract updating(newState: Partial<TData>): void;
}
