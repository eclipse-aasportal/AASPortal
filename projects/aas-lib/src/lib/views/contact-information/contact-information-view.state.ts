/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { noop } from 'aas-core';
import { ContactInformationState } from './contact-information.state';
import { LeafViewData, LeafViewState } from '../leaf-view-state';

export type ContactInformationViewData = LeafViewData;

export const initialState: ContactInformationViewData = {
    tuples: [],
};

@Injectable({
    providedIn: 'root',
})
export class ContactInformationViewState extends LeafViewState<ContactInformationViewData> {
    public constructor() {
        super(initialState);
    }
    public readonly contactInformationState = new ContactInformationState();

    protected override updating(newState: Partial<ContactInformationViewData>): void {
        noop(newState);
    }
}
