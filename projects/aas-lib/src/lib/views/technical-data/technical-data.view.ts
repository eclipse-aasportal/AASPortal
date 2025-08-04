/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateModule } from '@ngx-translate/core';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { ChangeDetectionStrategy, Component, effect, Inject, OnDestroy, OnInit, TemplateRef, viewChild } from '@angular/core';

import { ToolbarService } from '../../services/toolbar.service';
import { EndpointsApi } from '../../services/endpoints-api';
import { StartService } from '../../services/start.service';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { TechnicalData } from './technical-data';
import { LeafView } from '../view-leaf';
import { VIEW_ROUTES, ViewRoute } from '../../types';

@Component({
    selector: 'fhg-technical-data-view',
    imports: [TranslateModule, NgbPaginationModule, NgbAccordionModule, ThumbnailQRCode, TechnicalData],
    templateUrl: './technical-data.view.html',
    styleUrl: './technical-data.view.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicalDataView extends LeafView implements OnInit, OnDestroy {
    public constructor(
        route: ActivatedRoute,
        api: EndpointsApi,
        @Inject(VIEW_ROUTES) viewRoutes: ViewRoute[],
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
    ) {
        super(route, api, viewRoutes, 'TechnicalData');

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    public ngOnInit(): void {
        this.onInit();
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        return EMPTY;
    }
}
