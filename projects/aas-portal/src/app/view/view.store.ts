/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal, untracked } from '@angular/core';
import { DocumentSubmodelPair } from 'aas-lib';

type ViewState = {
    template: string | undefined;
    submodels: DocumentSubmodelPair[];
};

const initialState: ViewState = {
    template: undefined,
    submodels: [],
};

@Injectable({
    providedIn: 'root',
})
export class ViewStore {
    public template$ = signal<string | undefined>(initialState.template);

    public submodels$ = signal<DocumentSubmodelPair[]>(initialState.submodels);

    public get template(): string | undefined {
        return untracked(this.template$);
    }

    public get submodels(): DocumentSubmodelPair[] {
        return untracked(this.submodels$);
    }
}
