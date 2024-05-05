/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { NotifyService, OnlineState } from 'aas-lib';
import { AASDocument } from 'common';
import { BehaviorSubject, Observable } from 'rxjs';
import { AASApiService } from './aas-api.service';

@Injectable({
    providedIn: 'root',
})
export class AASStoreService {
    private _document: AASDocument | null = null;
    private _state: OnlineState = 'offline';
    private readonly search$ = new BehaviorSubject('');

    public constructor(
        private readonly api: AASApiService,
        private readonly notify: NotifyService,
    ) {}

    public get document(): AASDocument | null {
        return this._document;
    }

    public get state(): OnlineState {
        return this._state;
    }

    public get search(): Observable<string> {
        return this.search$.asObservable();
    }

    public getDocumentContent(document: AASDocument): void {
        this.api.getContent(document.id, document.endpoint).subscribe({
            next: content => (this._document = { ...document, content }),
            error: () => (this._document = document),
        });
    }

    public getDocument(id: string, endpoint: string): void {
        this.api.getDocument(id, endpoint).subscribe({
            next: document => (this._document = document),
        });
    }

    public setDocument(document: AASDocument | null): void {
        this._document = document;
    }

    public applyDocument(document: AASDocument): void {
        this._document = { ...document, modified: true };
    }

    public resetModified(document: AASDocument): void {
        this._document = { ...document, modified: false };
    }

    public setSearch(value: string): void {
        this.search$.next(value);
    }

    public setState(value: 'offline' | 'online'): void {
        this._state = value;
    }
}
