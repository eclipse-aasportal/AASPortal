/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ToolbarService {
    private readonly toolbarTemplate$ = new BehaviorSubject<TemplateRef<unknown> | null>(null);

    public constructor() {
        this.toolbarTemplate = this.toolbarTemplate$.asObservable();
    }

    public readonly toolbarTemplate: Observable<TemplateRef<unknown> | null>;

    public set(value: TemplateRef<unknown>): void {
        Promise.resolve().then(() => this.toolbarTemplate$.next(value));
    }

    public clear(): void {
        Promise.resolve().then(() => this.toolbarTemplate$.next(null));
    }
}