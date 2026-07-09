/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'fhg-form-error',
    imports: [TranslatePipe],
    templateUrl: './form-error.html',
    styleUrl: './form-error.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormError {
    public readonly field = input.required<FieldState<unknown>>();
}
