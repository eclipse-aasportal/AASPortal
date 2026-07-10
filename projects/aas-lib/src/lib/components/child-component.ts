/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, computed, inject, Signal, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({ selector: 'awp-child', changeDetection: ChangeDetectionStrategy.Eager, template: '' })
export abstract class ChildComponent {
    /** The translate service. */
    protected readonly translate = inject(TranslateService);

    /** The current active language. */
    protected readonly currentLang = computed(() => this.translate.currentLang() ?? 'en-us');
}
