/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, computed, inject, Signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({ selector: 'awp-child', template: '' })
export abstract class ChildComponent {
    protected constructor() {
        const langChange = toSignal(this.translate.onLangChange);
        this.currentLang = computed(() => langChange()?.lang ?? this.translate.getCurrentLang());
    }

    /** The translate service. */
    protected readonly translate = inject(TranslateService);

    /** The current active language. */
    protected readonly currentLang: Signal<string>;
}
