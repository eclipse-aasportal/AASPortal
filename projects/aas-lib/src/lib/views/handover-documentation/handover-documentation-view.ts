/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateDirective } from '@ngx-translate/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
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
import { StartService } from '../../services/start.service';
import { encodeBase64Url } from '../../utilities';

/**
 * Provides a view for submodels that correspond to the IDTA specification "Handover documentation".
 */
@Component({
    selector: 'fhg-handover-documentation-view',
    templateUrl: './handover-documentation-view.html',
    styleUrls: ['./handover-documentation-view.scss'],
    imports: [TranslateDirective, NgbPaginationModule, ThumbnailQRCode, HandoverDocumentation],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandoverDocumentationView extends LeafView<HandoverDocumentationViewState> implements OnInit, OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);

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

    /**
     * The template for the toolbar.
     */
    public readonly toolbarTemplate = viewChild<TemplateRef<HandoverDocumentationView>>('toolbar');

    /**
     * The state of the handover documentation.
     */
    public readonly handoverDocumentationState = this.state.handoverDocumentationState;

    public ngOnInit(): void {
        this.onInit();
    }

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
        const href = `/views/HandoverDocumentation;endpoint=${encodeBase64Url(endpoint)};id=${encodeBase64Url(id)}`;
        if (!this.start.add('Favorite', `HOD#${endpoint}#${id}`, { endpoint, id, href })) {
            return of(void 0);
        }

        return this.start.save();
    }
}
