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

import { aas } from 'aas-core';

import { ToolbarService } from '../../services/toolbar.service';
import { EndpointsApi } from '../../services/endpoints-api';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { HandoverDocumentation } from './handover-documentation';
import { HANDOVER_DOCUMENTATION_1_2, HANDOVER_DOCUMENTATION_2_0 } from '../views';
import { View } from '../view';

export type DocumentationItem = {
    title: string;
    version: string;
    filename: string;
    file: aas.File;
};

@Component({
    selector: 'fhg-handover-documentation-view',
    templateUrl: './handover-documentation.view.html',
    styleUrls: ['./handover-documentation.view.scss'],
    imports: [TranslateModule, NgbPaginationModule, ThumbnailQRCode, HandoverDocumentation],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandoverDocumentationView extends View implements OnInit, OnDestroy {
    public constructor(
        route: ActivatedRoute,
        private readonly toolbar: ToolbarService,
        api: EndpointsApi,
    ) {
        super(route, api);

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    protected override get expectedSemanticIds(): string[] {
        return [HANDOVER_DOCUMENTATION_1_2, HANDOVER_DOCUMENTATION_2_0];
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
