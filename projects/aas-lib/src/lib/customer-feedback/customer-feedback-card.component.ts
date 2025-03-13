/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'fhg-customer-feedback-card',
    templateUrl: './customer-feedback-card.component.html',
    styleUrl: './customer-feedback-card.component.scss',
    standalone: true,
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFeedbackCardComponent {}
