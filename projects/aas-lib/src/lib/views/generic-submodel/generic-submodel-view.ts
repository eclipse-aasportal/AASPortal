/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { EMPTY, Observable } from 'rxjs';
import { Component, computed, effect, inject, OnDestroy, TemplateRef, viewChild } from '@angular/core';

import { encodeBase64Url, getDisplayName } from '../../utilities';
import { ToolbarService } from '../../shared/services/toolbar.service';
import { DocumentHeader } from '../../shared/components/document-header/document-header';
import { SubmodelTree } from '../../shared/components/submodel-tree/submodel-tree';
import { LeafView } from '../leaf-view';
import { VIEW_ROUTE_NAME } from '../view-route-name';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { StartService } from '../../shared/services/start.service';

/**
 * Generic, read-only view of a single submodel — same searchable/collapsible tree (via
 * SubmodelTree, shared with OperationalDataView) as OperationalDataView, but with no
 * assumption about which submodel it is showing. Used as the fallback (DefaultSubmodel
 * route) when a submodel matches no dedicated Leaf view.
 */
@Component({
    selector: 'fhg-generic-submodel-view',
    templateUrl: './generic-submodel-view.html',
    styleUrl: './generic-submodel-view.scss',
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'generic-submodel' }],
    imports: [DocumentHeader, FormsModule, TranslateDirective, TranslatePipe, SubmodelTree, NgbTooltip],
})
export class GenericSubmodelView extends LeafView implements OnDestroy {
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

    /** The submodel's own display name, shown as the page title. */
    public readonly title = computed(() => {
        const submodel = this.submodel();
        return submodel ? getDisplayName(submodel, null, this.currentLang()) : '';
    });

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        const document = this.document();
        if (
            document &&
            this.start.add('Favorite', `GSM#${document.endpoint}#${document.id}`, {
                endpoint: document.endpoint,
                id: document.id,
                caption: 'DocumentContent.CAPTION',
                href: `views/generic-submodel;endpoint=${encodeBase64Url(document.endpoint)};id=${encodeBase64Url(document.id)}`,
            })
        ) {
            return this.start.save();
        }

        return EMPTY;
    }
}
