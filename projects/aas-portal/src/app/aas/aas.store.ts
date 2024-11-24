/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal, untracked } from '@angular/core';
import { OnlineState } from 'aas-lib';
import { aas, AASDocument } from 'aas-core';

@Injectable({
    providedIn: 'root',
})
export class AASStore {
    public readonly document$ = signal<AASDocument | null>(null);

    public readonly state$ = signal<OnlineState>('offline');

    public readonly searchExpression$ = signal('');

    public readonly selectedElements$ = signal<aas.Referable[]>([]);

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
