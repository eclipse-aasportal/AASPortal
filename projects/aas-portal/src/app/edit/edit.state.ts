/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';
import { aas, AASDocument, equalArray } from 'aas-core';

export type EditData = {
    document: AASDocument | null;
    selectedElements: aas.Referable[];
};

const initialState: EditData = {
    document: null,
    selectedElements: [],
};

/** Provides the state of the AAS page. */
@Injectable({ providedIn: 'root' })
export class EditState {
    private readonly document$ = signal(initialState.document);
    private readonly selectedElements$ = signal(initialState.selectedElements, {
        equal: (a, b) => equalArray(a, b),
    });

    /** The current active AAS document. */
    public readonly document = this.document$.asReadonly();

    /** The selected elements. */
    public readonly selectedElements = this.selectedElements$.asReadonly();

    public update(newState: Partial<EditData>): void {
        if (newState.document !== undefined) {
            this.document$.set(newState.document);
        }
    }
}
