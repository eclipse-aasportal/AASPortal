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
import { NameplateState } from '../nameplate/nameplate.state';
import { CarbonFootprintState } from '../carbon-footprint/carbon-footprint.state';
import { HandoverDocumentationState } from '../handover-documentation/handover-documentation.state';
import { ContactInformationState } from '../contact-information/contact-information.state';
import { TechnicalDataState } from '../technical-data/technical-data.state';

export type DppMetadataViewData = LeafViewData;

const initialState: DppMetadataViewData = {
    tuples: [],
};

/**
 * Holds one dedicated state instance per embeddable submodel view that DppMetadataView can
 * render for a submodel listed in contentSpecificationIds -- separate from the singleton state
 * each of those views owns for its own standalone route (e.g. NameplateViewState), so composing
 * them here never cross-talks with a directly-navigated Nameplate/CarbonFootprint/... page.
 */
@Injectable({
    providedIn: 'root',
})
export class DppMetadataViewState extends LeafViewState<DppMetadataViewData> {
    public constructor() {
        super(initialState);
    }

    public readonly nameplateState = new NameplateState();

    public readonly carbonFootprintState = new CarbonFootprintState();

    public readonly handoverDocumentationState = new HandoverDocumentationState();

    public readonly contactInformationState = new ContactInformationState();

    public readonly technicalDataState = new TechnicalDataState();

    protected override updating(newState: Partial<DppMetadataViewData>): void {
        noop(newState);
    }
}
