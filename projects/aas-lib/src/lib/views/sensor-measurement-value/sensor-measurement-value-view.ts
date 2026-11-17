/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, effect, inject, TemplateRef, viewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { NgbPaginationModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

import { LeafView } from '../leaf-view';
import { VIEW_ROUTE_NAME } from '../view-route-name';
import { SensorMeasurementValue } from './sensor-measurement-value';
import { DocumentHeader } from '../../shared/components/document-header/document-header';
import { ToolbarService } from '../../shared/services/toolbar.service';
import { EMPTY, Observable } from 'rxjs';
import { StartService } from '../../shared/services/start.service';
import { encodeBase64Url } from '../../utilities';

@Component({
    selector: 'fhg-sensor-measurement-value-view',
    templateUrl: './sensor-measurement-value-view.html',
    styleUrl: './sensor-measurement-value-view.scss',
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'sensor-measurement-value' }],
    imports: [
        RouterModule,
        TranslateDirective,
        TranslatePipe,
        NgbPaginationModule,
        DocumentHeader,
        SensorMeasurementValue,
        NgbTooltip,
    ],
})
export class SensorMeasurementValueView extends LeafView {
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);

    public constructor() {
        super();

        effect(() => {
            const template = this.toolbarTemplate();
            if (template !== undefined) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    public addToStart(): Observable<void> {
        const document = this.document();
        if (
            document &&
            this.start.add('Favorite', `SMV#${document.endpoint}#${document.id}`, {
                endpoint: document.endpoint,
                id: document.id,
                caption: 'SensorMeasurementValue.TITLE',
                href: `views/sensor-measurement-value;endpoint=${encodeBase64Url(document.endpoint)};id=${encodeBase64Url(document.id)}`,
            })
        ) {
            return this.start.save();
        }

        return EMPTY;
    }
}
