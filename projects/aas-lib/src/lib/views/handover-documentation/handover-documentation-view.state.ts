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
import { HandoverDocumentationState } from './handover-documentation.state';

export type HandoverDocumentationViewData = LeafViewData;

const initialState: HandoverDocumentationViewData = {
    tuples: [],
};

@Injectable({
    providedIn: 'root',
})
export class HandoverDocumentationViewState extends LeafViewState<HandoverDocumentationViewData> {
    public constructor() {
        super(initialState);
    }

    public readonly handoverDocumentationState = new HandoverDocumentationState();

    protected override updating(newState: Partial<HandoverDocumentationViewData>): void {
        noop(newState);
    }
}
