/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';
import { AASTreeData, LiveState } from 'aas-lib';
import { aas, AASDocument, equalArray } from 'aas-core';

export type AASData = {
    document: AASDocument | null;
    live: LiveState;
    searchExpression: string;
    selectedElements: aas.Referable[];
};

const initialState: AASData = {
    document: null,
    live: 'offline',
    searchExpression: '',
    selectedElements: [],
};

/** Provides the state of the AAS page. */
@Injectable({ providedIn: 'root' })
export class AASState {
    private readonly document$ = signal(initialState.document);
    private readonly live$ = signal(initialState.live);
    private readonly searchExpression$ = signal(initialState.searchExpression);
    private readonly selectedElements$ = signal(initialState.selectedElements, {
        equal: (a, b) => equalArray(a, b),
    });

    /** The current active AAS document. */
    public readonly document = this.document$.asReadonly();

    /** Indicates the current live state. */
    public readonly live= this.live$.asReadonly();

    /** The current search or filter expression. */
    public readonly searchExpression = this.searchExpression$.asReadonly();;

    /** The selected elements. */
    public readonly selectedElements = this.selectedElements$.asReadonly();

    public readonly treeState = signal<AASTreeData | undefined>(undefined);

    public update(newState: Partial<AASData>): void {
        if (newState.document !== undefined) {
            this.document$.set(newState.document);
        }

        if (newState.live) {
            this.live$.set(newState.live);
        }

        if (newState.searchExpression !== undefined) {
            this.searchExpression$.set(newState.searchExpression);
        }

        if (newState.selectedElements) {
            this.selectedElements$.set(newState.selectedElements);
        }
    }
}
