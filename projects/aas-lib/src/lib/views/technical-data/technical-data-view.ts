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
import { TechnicalData } from './technical-data';
import { VIEW_ROUTES } from '../../types';
import { TechnicalDataViewState } from './technical-data-view.state';
import { LeafView } from '../leaf-view';

@Component({
    selector: 'fhg-technical-data-view',
    imports: [TranslateModule, NgbPaginationModule, NgbAccordionModule, ThumbnailQRCode, TechnicalData],
    templateUrl: './technical-data-view.html',
    styleUrl: './technical-data-view.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicalDataView extends LeafView<TechnicalDataViewState> implements OnInit, OnDestroy {
    private readonly toolbar = inject(ToolbarService);

    public constructor() {
        super(
            inject(ActivatedRoute),
            inject(EndpointsApi),
            inject(VIEW_ROUTES),
            'TechnicalData',
            inject(TechnicalDataViewState),
        );

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    public readonly technicalDataState = this.state.technicalDataState;

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
