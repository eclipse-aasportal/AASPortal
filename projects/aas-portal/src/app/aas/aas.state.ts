/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';
import { AASDocument } from 'aas-core';

export type AASData = {
    document: AASDocument | null;
};

const initialState: AASData = {
    document: null,
};

/** Provides the state of the AAS page. */
@Injectable({ providedIn: 'root' })
export class AASState {
    private readonly document$ = signal(initialState.document);

    /** The current active AAS document. */
    public readonly document = this.document$.asReadonly();

    public update(newState: Partial<AASData>): void {
        if (newState.document !== undefined) {
            this.document$.set(newState.document);
        }
    }
}
