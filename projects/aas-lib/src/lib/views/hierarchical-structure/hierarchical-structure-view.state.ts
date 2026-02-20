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

export type HierarchicalStructureViewData = LeafViewData;

const initialState: HierarchicalStructureViewData = {
    tuples: [],
};

@Injectable({
    providedIn: 'root',
})
export class HierarchicalStructureViewState extends LeafViewState<HierarchicalStructureViewData> {
    public constructor() {
        super(initialState);
    }

    protected override updating(newState: Partial<HierarchicalStructureViewData>): void {
        noop(newState);
    }
}
