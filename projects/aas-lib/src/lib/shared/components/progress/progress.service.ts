/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ProgressService {
    private readonly visible$ = signal(false);
    private readonly label$ = signal<string | undefined>(undefined);
    private readonly value$ = signal(0);
    private reentry = 0;

    public readonly visible = this.visible$.asReadonly();

    public readonly label = this.label$.asReadonly();

    public readonly value = this.value$.asReadonly();

    public begin(label?: string): void {
        ++this.reentry;
        if (this.reentry === 1) {
            this.label$.set(label);
            this.value$.set(0);
            this.visible$.set(true);
        }
    }

    public set(value: number, label?: string): void {
        if (this.visible$()) {
            this.value$.set(Math.max(0, Math.min(100, value)));
            if (label) {
                this.label$.set(label);
            }
        }
    }

    public end(): void {
        if (this.reentry > 0) {
            --this.reentry;
            if (this.reentry === 0) {
                this.visible$.set(false);
            }
        }
    }
}
