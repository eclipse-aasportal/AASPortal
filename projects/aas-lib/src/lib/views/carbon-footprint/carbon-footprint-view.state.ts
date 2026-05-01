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
import { CarbonFootprintState } from './carbon-footprint.state';

export type CarbonFootprintViewData = LeafViewData;

const initialState: CarbonFootprintViewData = {
    tuples: [],
};

/**
 * The state of the Carbon Footprint view.
 */
@Injectable({
    providedIn: 'root',
})
export class CarbonFootprintViewState extends LeafViewState<CarbonFootprintViewData> {
    public constructor() {
        super(initialState);
    }

    /** The state of the Carbon Footprint component. */
    public readonly carbonFootprintState = new CarbonFootprintState();

    protected override updating(newState: Partial<CarbonFootprintViewData>): void {
        noop(newState);
    }
}
