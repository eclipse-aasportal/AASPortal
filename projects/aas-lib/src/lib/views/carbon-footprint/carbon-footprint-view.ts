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
import { of, Observable } from 'rxjs';
import { Component, effect, inject, OnDestroy, TemplateRef, viewChild } from '@angular/core';

import { ToolbarService } from '../../services/toolbar.service';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { CarbonFootprint } from './carbon-footprint';
import { LeafView } from '../leaf-view';
import { CarbonFootprintViewState } from './carbon-footprint-view.state';
import { StartService } from '../../services/start.service';
import { encodeBase64Url } from '../../utilities';
import { VIEW_ROUTE_NAME } from '../view-route-name';

/**
 * Provides a view for a submodel that belongs to the IDTA specification "Carbon Footprint".
 */
@Component({
    selector: 'fhg-carbon-footprint-view',
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'CarbonFootprint' }],
    imports: [
        TranslateDirective,
        NgbPaginationModule,
        NgbAccordionModule,
        ThumbnailQRCode,
        CarbonFootprint,
        RouterModule,
    ],
    templateUrl: './carbon-footprint-view.html',
    styleUrl: './carbon-footprint-view.scss',
})
export class CarbonFootprintView extends LeafView implements OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);
    private readonly state = inject(CarbonFootprintViewState);

    public constructor() {
        super();

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    /** The specific toolbar. */
    public readonly toolbarTemplate = viewChild<TemplateRef<CarbonFootprintView>>('toolbar');

    /** The state of the carbon footprint component. */
    public readonly carbonFootprintState = this.state.carbonFootprintState;

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    /**
     * Adds the current document to the start service as a favorite.
     * @returns An `Observable<void>` that completes when the document is successfully added to the start service and saved.
     * Returns `EMPTY` if the document is undefined or if adding to the start service fails.
     */
    public addToStart(): Observable<void> {
        const document = this.document();
        if (document === undefined) {
            return of(void 0);
        }

        const endpoint = document.endpoint;
        const id = document.id;
        const href = `/views/CarbonFootprint;endpoint=${encodeBase64Url(endpoint)};id=${encodeBase64Url(id)}`;
        if (!this.start.add('Favorite', `CFV#${endpoint}#${id}`, { endpoint, id, href })) {
            return of(void 0);
        }

        return this.start.save();
    }
}
