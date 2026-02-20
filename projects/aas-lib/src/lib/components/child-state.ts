/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

/**
 * Represents the state of a child component.
 */
export abstract class ChildState {
    protected constructor(protected readonly translate: TranslateService) {
        const langChange = toSignal(this.translate.onLangChange);
        this.currentLang = computed(() => langChange()?.lang ?? this.translate.getCurrentLang());
    }

    /** The current language. */
    protected readonly currentLang: Signal<string>;
}
