/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, inject } from '@angular/core';
import { ProgressService } from './progress.service';

@Component({
    selector: 'fhg-progress',
    imports: [],
    templateUrl: './progress.component.html',
    styleUrl: './progress.component.scss',
})
export class ProgressComponent {
    private readonly service = inject(ProgressService);

    public readonly visible = this.service.visible;

    public readonly label = this.service.label;

    public readonly value = this.service.value;
}
