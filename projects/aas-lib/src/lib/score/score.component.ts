/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
    selector: 'fhg-score',
    templateUrl: './score.component.html',
    styleUrls: ['./score.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreComponent {
    public readonly score = input(0.0);

    public readonly positive = computed(() =>
        this.score() >= 0.0 ? Math.min(Math.round(this.score() * 100), 100) : 0,
    );

    public readonly negative = computed(() =>
        this.score() >= 0.0 ? 0 : Math.min(Math.round(Math.abs(this.score()) * 100), 100),
    );
}
