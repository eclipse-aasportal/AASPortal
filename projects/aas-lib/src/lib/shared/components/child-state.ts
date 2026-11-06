/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * Represents the state of a child component.
 */
export abstract class ChildState {
    protected constructor(protected readonly translate: TranslateService) {}

    /** The current language. */
    protected readonly currentLang = computed(() => this.translate.currentLang() ?? 'en-us');
}
