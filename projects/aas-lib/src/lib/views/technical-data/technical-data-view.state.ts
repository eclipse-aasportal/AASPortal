/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { noop } from 'aas-core';
import { LeafViewData, LeafViewState } from '../leaf-view-state';
import { TechnicalDataState } from './technical-data.state';

export type TechnicalDataViewData = LeafViewData;

const initialState: TechnicalDataViewData = {
    tuples: [],
};

@Injectable({
    providedIn: 'root',
})
export class TechnicalDataViewState extends LeafViewState<TechnicalDataViewData> {
    public constructor() {
        super(initialState);
    }

    public readonly technicalDataState = new TechnicalDataState();

    protected override updating(newState: Partial<TechnicalDataViewData>): void {
        noop(newState);
    }
}
