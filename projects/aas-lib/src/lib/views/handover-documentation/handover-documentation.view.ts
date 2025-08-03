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
import { ChangeDetectionStrategy, Component, effect, OnDestroy, OnInit, TemplateRef, viewChild } from '@angular/core';

import { ToolbarService } from '../../services/toolbar.service';
import { EndpointsApi } from '../../services/endpoints-api';
import { HandoverDocumentation, LeafView, ThumbnailQRCode } from '../../internal';

/** Provides a specific view for the handover documentation submodel. */
@Component({
    selector: 'fhg-handover-documentation-view',
    templateUrl: './handover-documentation.view.html',
    styleUrls: ['./handover-documentation.view.scss'],
    imports: [TranslateModule, NgbPaginationModule, ThumbnailQRCode, HandoverDocumentation],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandoverDocumentationView extends LeafView implements OnInit, OnDestroy {
    public constructor(
        route: ActivatedRoute,
        api: EndpointsApi,
        private readonly toolbar: ToolbarService,
    ) {
        super(route, api, 'HandoverDocumentation');

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<HandoverDocumentationView>>('toolbar');

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
