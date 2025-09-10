/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateModule } from '@ngx-translate/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
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
import { HandoverDocumentation } from './handover-documentation';
import { LeafView } from '../leaf-view';
import { VIEW_ROUTES } from '../../types';
import { HandoverDocumentationViewState } from './handover-documentation-view.state';

/** Provides a specific view for the handover documentation submodel. */
@Component({
    selector: 'fhg-handover-documentation-view',
    templateUrl: './handover-documentation-view.html',
    styleUrls: ['./handover-documentation-view.scss'],
    imports: [TranslateModule, NgbPaginationModule, ThumbnailQRCode, HandoverDocumentation],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandoverDocumentationView extends LeafView<HandoverDocumentationViewState> implements OnInit, OnDestroy {
    private readonly toolbar = inject(ToolbarService);

    public constructor() {
        super(
            inject(ActivatedRoute),
            inject(EndpointsApi),
            inject(VIEW_ROUTES),
            'HandoverDocumentation',
            inject(HandoverDocumentationViewState),
        );

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<HandoverDocumentationView>>('toolbar');

    public readonly handoverDocumentationState = this.state.handoverDocumentationState;

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
