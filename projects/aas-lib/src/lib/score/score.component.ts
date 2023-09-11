/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
    selector: 'fhg-score',
    templateUrl: './score.component.html',
    styleUrls: ['./score.component.scss']
})
export class ScoreComponent implements OnChanges {
    @Input()
    public score = 0.0;

    public positive = 0;

    public negative = 0;

    public ngOnChanges(changes: SimpleChanges): void {
        if(changes['score']) {
            if (this.score >= 0.0) {
                this.positive = Math.min(Math.round(this.score * 100), 100);
                this.negative = 0;
            } else {
                this.positive = 0;
                this.negative = Math.min(Math.round(Math.abs(this.score) * 100), 100);
            }
        }
    }
}