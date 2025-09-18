/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { noop } from 'aas-core';
import { CompositeViewData, CompositeViewState } from '../composite-view-state';
import { NameplateState } from '../nameplate/nameplate.state';
import { CarbonFootprintState } from '../carbon-footprint/carbon-footprint.state';
import { HandoverDocumentationState } from '../handover-documentation/handover-documentation.state';

export type DigitalProductPassportViewData = CompositeViewData;

const initialState: DigitalProductPassportViewData = {
    tuples: [],
};

@Injectable({
    providedIn: 'root',
})
export class DigitalProductPassportViewState extends CompositeViewState<DigitalProductPassportViewData> {
    public constructor() {
        super(initialState);
    }

    public readonly nameplateState = new NameplateState();

    public readonly handoverDocumentationState = new HandoverDocumentationState();

    public readonly carbonFootprintState = new CarbonFootprintState();

    protected override updating(newState: Partial<DigitalProductPassportViewData>): void {
        noop(newState);
    }
}
