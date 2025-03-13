/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
    selector: 'fhg-digital-product-passport-card',
    templateUrl: './digital-product-passport-card.component.html',
    styleUrl: './digital-product-passport-card.component.scss',
    standalone: true,
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalProductPassportCardComponent {
    public readonly endpoint = input('');
    public readonly id = input('');
}
