/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateDirective } from '@ngx-translate/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { LeafView } from '../leaf-view';
import { VIEW_ROUTE_NAME } from '../view-route-name';
import { SensorMeasurementValue } from './sensor-measurement-value';

@Component({
    selector: 'fhg-sensor-measurement-value-view',
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'SensorMeasurementValue' }],
    imports: [RouterModule, TranslateDirective, NgbPaginationModule, ThumbnailQRCode, SensorMeasurementValue],
    templateUrl: './sensor-measurement-value-view.html',
    styleUrl: './sensor-measurement-value-view.scss',
})
export class SensorMeasurementValueView extends LeafView {
    public constructor() {
        super();
    }
}
