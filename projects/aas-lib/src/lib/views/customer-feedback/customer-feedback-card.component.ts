/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';

import { ScoreComponent } from '../../components/score/score.component';
import { GeneralItem } from './customer-feedback.types';

@Component({
    selector: 'fhg-customer-feedback-card',
    templateUrl: './customer-feedback-card.component.html',
    styleUrl: './customer-feedback-card.component.scss',
    standalone: true,
    imports: [ScoreComponent, DecimalPipe, TranslateDirective, TranslatePipe],
})
export class CustomerFeedbackCardComponent {
    public readonly count = input(0);

    public readonly stars = input(0.0);

    public readonly overallRating = input(0);

    public readonly items = input<GeneralItem[]>([]);

    public readonly starClassNames = input<string[]>([]);

    public readonly href = input('');
}
