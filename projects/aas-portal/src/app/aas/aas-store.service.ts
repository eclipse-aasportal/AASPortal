/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';
import { OnlineState } from 'aas-lib';
import { AASDocument } from 'common';
import { AASApiService } from './aas-api.service';

@Injectable({
    providedIn: 'root',
})
export class AASStoreService {
    private readonly _document = signal<AASDocument | null>(null);

    public constructor(private readonly api: AASApiService) {}

    public readonly document = this._document.asReadonly();

    public readonly state = signal<OnlineState>('offline');

    public readonly search = signal('');

    public getDocumentContent(document: AASDocument): void {
        this.api.getContent(document.id, document.endpoint).subscribe({
            next: content => this._document.set({ ...document, content }),
            error: () => this._document.set(document),
        });
    }

    public getDocument(id: string, endpoint: string): void {
        this.api.getDocument(id, endpoint).subscribe({
            next: document => this._document.set(document),
        });
    }

    public setDocument(document: AASDocument | null): void {
        this._document.set(document);
    }

    public applyDocument(document: AASDocument): void {
        this._document.set({ ...document, modified: true });
    }

    public resetModified(document: AASDocument): void {
        this._document.set({ ...document, modified: false });
    }
}
