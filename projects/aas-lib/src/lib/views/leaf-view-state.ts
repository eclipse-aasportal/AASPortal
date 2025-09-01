/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Signal, signal, WritableSignal } from '@angular/core';
import { aas, AASDocument } from 'aas-core';

export interface LeafViewData {
    tuples: [AASDocument, aas.Submodel][];
}

export abstract class LeafViewState<TData extends LeafViewData> {
    private readonly tuples$: WritableSignal<[AASDocument, aas.Submodel][]>;

    protected constructor(initialState: TData) {
        this.tuples$ = signal(initialState.tuples);
        this.tuples = this.tuples$.asReadonly();
    }

    public readonly tuples: Signal<[AASDocument, aas.Submodel][]>;

    public update(newState: Partial<TData>): void {
        const tuples = (newState as LeafViewData).tuples;
        if (tuples !== null) {
            this.tuples$.set(tuples);
        }

        this.updating(newState);
    }

    protected abstract updating(newState: Partial<TData>): void;
}
