/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { noop } from 'aas-core';
import { LeafViewData, LeafViewState } from '../leaf-view-state';

export type GenericSubmodelViewData = LeafViewData;

const initialState: GenericSubmodelViewData = {
    tuples: [],
};

@Injectable({
    providedIn: 'root',
})
export class GenericSubmodelViewState extends LeafViewState<GenericSubmodelViewData> {
    public constructor() {
        super(initialState);
    }

    protected override updating(newState: Partial<GenericSubmodelViewData>): void {
        noop(newState);
    }
}
