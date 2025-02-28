/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal, untracked } from '@angular/core';
import { OnlineState } from 'aas-lib';
import { aas, AASDocument, equalArray } from 'aas-core';

type AASState = {
    document: AASDocument | null;
    state: OnlineState;
    searchExpression: string;
    selectedElements: aas.Referable[];
};

const initialState: AASState = {
    document: null,
    state: 'offline',
    searchExpression: '',
    selectedElements: [],
};

@Injectable({
    providedIn: 'root',
})
export class AASStore {
    public readonly document$ = signal<AASDocument | null>(initialState.document);

    public readonly state$ = signal<OnlineState>(initialState.state);

    public readonly searchExpression$ = signal(initialState.searchExpression);

    public readonly selectedElements$ = signal<aas.Referable[]>(initialState.selectedElements, {
        equal: (a, b) => equalArray(a, b),
    });

    public get document(): AASDocument | null {
        return untracked(this.document$);
    }

    public get state(): OnlineState {
        return untracked(this.state$);
    }

    public get searchExpression(): string {
        return untracked(this.searchExpression$);
    }

    public get selectedElements(): aas.Referable[] {
        return untracked(this.selectedElements$);
    }
}
