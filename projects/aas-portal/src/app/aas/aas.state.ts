/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';
import { AASDocument } from 'aas-core';

export type AASLoadError = 'permission' | 'other';

export type AASData = {
    document: AASDocument | null;
    error: AASLoadError | null;
};

const initialState: AASData = {
    document: null,
    error: null,
};

/** Provides the state of the AAS page. */
@Injectable({ providedIn: 'root' })
export class AASState {
    private readonly document$ = signal(initialState.document);
    private readonly error$ = signal(initialState.error);

    /** The current active AAS document. */
    public readonly document = this.document$.asReadonly();

    /** Set when the current document failed to load, e.g. because of a missing/invalid endpoint API key. */
    public readonly error = this.error$.asReadonly();

    public update(newState: Partial<AASData>): void {
        if (newState.document !== undefined) {
            this.document$.set(newState.document);
        }

        if (newState.error !== undefined) {
            this.error$.set(newState.error);
        }
    }
}
