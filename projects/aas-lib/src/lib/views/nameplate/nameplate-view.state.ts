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
import { NameplateState } from './nameplate.state';

export type NameplateViewData = LeafViewData;

const initialState: NameplateViewData = {
    tuples: [],
};

@Injectable({
    providedIn: 'root',
})
export class NameplateViewState extends LeafViewState<NameplateViewData> {
    public constructor() {
        super(initialState);
    }

    public readonly nameplateState = new NameplateState();

    public override updating(newState: Partial<NameplateViewData>): void {
        noop(newState);
    }
}
