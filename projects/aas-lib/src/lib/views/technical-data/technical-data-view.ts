/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateDirective } from '@ngx-translate/core';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Component, effect, inject, OnDestroy, TemplateRef, viewChild } from '@angular/core';

import { ToolbarService } from '../../services/toolbar.service';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { TechnicalData } from './technical-data';
import { TechnicalDataViewState } from './technical-data-view.state';
import { LeafView } from '../leaf-view';
import { StartService } from '../../services/start.service';
import { encodeBase64Url } from '../../utilities';
import { VIEW_ROUTE_NAME } from '../view-route-name';

@Component({
    selector: 'fhg-technical-data-view',
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'TechnicalData' }],
    imports: [
        TranslateDirective,
        NgbPaginationModule,
        NgbAccordionModule,
        ThumbnailQRCode,
        TechnicalData,
        RouterModule,
    ],
    templateUrl: './technical-data-view.html',
    styleUrl: './technical-data-view.scss',
})
export class TechnicalDataView extends LeafView implements OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);
    private readonly state = inject(TechnicalDataViewState);

    public constructor() {
        super();

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    public readonly technicalDataState = this.state.technicalDataState;

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    /**
     * Adds the current handover documentation view to the start service as a favorite.
     * @returns An `Observable<void>`.
     */
    public addToStart(): Observable<void> {
        const document = this.document();
        if (document === undefined) {
            return of(void 0);
        }

        const endpoint = document.endpoint;
        const id = document.id;
        const href = `/views/TechnicalData;endpoint=${encodeBase64Url(endpoint)};id=${encodeBase64Url(id)}`;
        if (!this.start.add('Favorite', `TDV#${endpoint}#${id}`, { endpoint, id, href })) {
            return of(void 0);
        }

        return this.start.save();
    }
}
