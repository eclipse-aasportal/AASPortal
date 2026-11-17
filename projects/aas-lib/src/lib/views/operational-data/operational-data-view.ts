/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { EMPTY, Observable } from 'rxjs';
import { Component, effect, inject, OnDestroy, TemplateRef, viewChild } from '@angular/core';

import { ToolbarService } from '../../shared/services/toolbar.service';
import { DocumentHeader } from '../../shared/components/document-header/document-header';
import { SubmodelTree } from '../../shared/components/submodel-tree/submodel-tree';
import { LeafView } from '../leaf-view';
import { VIEW_ROUTE_NAME } from '../view-route-name';
import { NgbPagination, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { StartService } from '../../shared/services/start.service';
import { encodeBase64Url } from '../../utilities';

@Component({
    selector: 'fhg-operational-data-view',
    templateUrl: './operational-data-view.html',
    styleUrl: './operational-data-view.scss',
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'operational-data' }],
    imports: [DocumentHeader, TranslateDirective, TranslatePipe, SubmodelTree, NgbTooltip, NgbPagination],
})
export class OperationalDataView extends LeafView implements OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);

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
        const document = this.document();
        if (
            document &&
            this.start.add('Favorite', `OPD#${document.endpoint}#${document.id}`, {
                endpoint: document.endpoint,
                id: document.id,
                caption: 'OperationalData.TITLE',
                href: `views/operational-data;endpoint=${encodeBase64Url(document.endpoint)};id=${encodeBase64Url(document.id)}`,
            })
        ) {
            return this.start.save();
        }

        return EMPTY;
    }
}
