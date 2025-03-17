/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
    selector: 'fhg-digital-nameplate-card',
    templateUrl: './digital-nameplate-card.component.html',
    styleUrl: './digital-nameplate-card.component.scss',
    standalone: true,
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalNameplateCardComponent {
    public readonly endpoint = input('');
    public readonly id = input('');
}
