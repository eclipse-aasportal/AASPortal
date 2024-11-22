/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal, untracked } from '@angular/core';
import { ViewMode } from 'aas-lib';
import { AASDocument, AASDocumentId } from 'aas-core';

@Injectable({
    providedIn: 'root',
})
export class StartStore {
    public readonly viewMode$ = signal(ViewMode.Undefined);

    public readonly documents$ = signal<AASDocument[]>([]);

    public readonly activeFavorites$ = signal('');

    public readonly limit$ = signal(10);

    public readonly filterText$ = signal('');

    public readonly selected$ = signal<AASDocument[]>([]);

    public readonly previous$ = signal<AASDocumentId | null>(null);

    public readonly next$ = signal<AASDocumentId | null>(null);

    public get viewMode(): ViewMode {
        return untracked(this.viewMode$);
    }

    public get documents(): AASDocument[] {
        return untracked(this.documents$);
    }

    public get activeFavorites(): string {
        return untracked(this.activeFavorites$);
    }

    public get limit(): number {
        return untracked(this.limit$);
    }

    public get filterText(): string {
        return untracked(this.filterText$);
    }

    public get selected(): AASDocument[] {
        return untracked(this.selected$);
    }

    public get previous(): AASDocumentId | null {
        return untracked(this.previous$);
    }

    public get next(): AASDocumentId | null {
        return untracked(this.next$);
    }
}
