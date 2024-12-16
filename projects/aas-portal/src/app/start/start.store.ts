/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal, untracked } from '@angular/core';
import { first, mergeMap, Observable, skipWhile } from 'rxjs';
import { AASDocument, AASDocumentId } from 'aas-core';
import { AuthService, ViewMode } from 'aas-lib';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type StartState = {
    viewMode: ViewMode;
    documents: AASDocument[];
    activeFavorites: string;
    limit: number;
    filterText: string;
    selected: AASDocument[];
    previous: AASDocumentId | null;
    next: AASDocumentId | null;
};

type StartCookie = {
    activeFavorites: string;
    limit: number;
    filterText: string;
};

const initialState: StartState = {
    viewMode: ViewMode.Undefined,
    documents: [],
    activeFavorites: '',
    limit: 10,
    filterText: '',
    selected: [],
    previous: null,
    next: null,
};

@Injectable({
    providedIn: 'root',
})
export class StartStore {
    public constructor(private readonly auth: AuthService) {
        this.auth.userId
            .pipe(
                skipWhile(userId => userId === undefined),
                takeUntilDestroyed(),
                mergeMap(() => this.auth.getCookie('.Start')),
            )
            .subscribe(value => {
                if (value === undefined) {
                    return;
                }

                const cookie: StartCookie = JSON.parse(value);
                this.activeFavorites$.set(cookie.activeFavorites);
                this.limit$.set(cookie.limit);
                this.filterText$.set(cookie.filterText);
            });
    }

    public readonly viewMode$ = signal(initialState.viewMode);

    public readonly documents$ = signal<AASDocument[]>(initialState.documents);

    public readonly activeFavorites$ = signal(initialState.activeFavorites);

    public readonly limit$ = signal(initialState.limit);

    public readonly filterText$ = signal(initialState.filterText);

    public readonly selected$ = signal<AASDocument[]>(initialState.selected);

    public readonly previous$ = signal<AASDocumentId | null>(initialState.previous);

    public readonly next$ = signal<AASDocumentId | null>(initialState.next);

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

    public save(): Observable<void> {
        const cookie: StartCookie = {
            activeFavorites: this.activeFavorites,
            limit: this.limit,
            filterText: this.filterText,
        };

        return this.auth.setCookie('.Start', JSON.stringify(cookie));
    }
}
