/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, TemplateRef, signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ToolbarService {
    private _toolbarTemplate = signal<TemplateRef<unknown> | null>(null);

    public readonly toolbarTemplate = this._toolbarTemplate.asReadonly();

    public set(value: TemplateRef<unknown>): Promise<void> {
        return Promise.resolve().then(() => this._toolbarTemplate.set(value));
    }

    public clear(): Promise<void> {
        return Promise.resolve().then(() => this._toolbarTemplate.set(null));
    }
}
