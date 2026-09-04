/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@ngx-translate/core';
import { EMPTY, Observable } from 'rxjs';
import { Component, effect, inject, OnDestroy, TemplateRef, viewChild } from '@angular/core';

import { ToolbarService } from '../../shared/services/toolbar.service';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { SubmodelTree } from '../../components/submodel-tree/submodel-tree';
import { LeafView } from '../leaf-view';
import { VIEW_ROUTE_NAME } from '../view-route-name';

@Component({
    selector: 'fhg-operational-data-view',
    templateUrl: './operational-data-view.html',
    styleUrl: './operational-data-view.scss',
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'OperationalData' }],
    imports: [ThumbnailQRCode, TranslateDirective, RouterLink, SubmodelTree],
})
export class OperationalDataView extends LeafView implements OnDestroy {
    private readonly toolbar = inject(ToolbarService);

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

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        return EMPTY;
    }
}
