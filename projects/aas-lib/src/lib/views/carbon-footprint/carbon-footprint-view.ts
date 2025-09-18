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
import { of, Observable } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    OnDestroy,
    OnInit,
    TemplateRef,
    viewChild,
} from '@angular/core';

import { ToolbarService } from '../../services/toolbar.service';
import { EndpointsApi } from '../../services/endpoints-api';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { CarbonFootprint } from './carbon-footprint';
import { LeafView } from '../leaf-view';
import { VIEW_ROUTES } from '../../types';
import { CarbonFootprintViewState } from './carbon-footprint-view.state';
import { StartService } from '../../services/start.service';
import { encodeBase64Url } from '../../utilities';

/**
 * Provides a view for a submodel that belongs to the IDTA specification "Carbon Footprint".
 */
@Component({
    selector: 'fhg-carbon-footprint-view',
    imports: [TranslateModule, NgbPaginationModule, NgbAccordionModule, ThumbnailQRCode, CarbonFootprint],
    templateUrl: './carbon-footprint-view.html',
    styleUrl: './carbon-footprint-view.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarbonFootprintView extends LeafView<CarbonFootprintViewState> implements OnInit, OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);

    public constructor() {
        super(
            inject(ActivatedRoute),
            inject(EndpointsApi),
            inject(VIEW_ROUTES),
            'CarbonFootprint',
            inject(CarbonFootprintViewState),
        );

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

    public ngOnInit(): void {
        this.onInit();
    }

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
