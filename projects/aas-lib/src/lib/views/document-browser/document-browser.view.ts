/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ActivatedRoute } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    OnDestroy,
    OnInit,
    TemplateRef,
    viewChild,
} from '@angular/core';

import { aas } from 'aas-core';

import { encodeBase64Url } from '../../utilities';
import { EndpointsApi } from '../../services/endpoints-api';
import { ToolbarService } from '../../services/toolbar.service';
import { StartService } from '../../services/start.service';
import { BrowserComponent } from '../../components/browser/browser.component';
import { CompositeView, ThumbnailQRCode } from '../../internal';

export type BrowserProperty = {
    name: string;
    value: string;
    kind: 'text' | 'link';
};

export type BrowserElementRef = {
    name: string;
    abbreviation: string;
    referable: aas.Referable;
};

export type BrowserElement = {
    name: string;
    referable: aas.Referable;
    collection?: string;
    properties: BrowserProperty[];
    children: BrowserElementRef[];
};

@Component({
    selector: 'fhg-doc-browser',
    templateUrl: './document-browser.view.html',
    styleUrl: './document-browser.view.scss',
    imports: [TranslateModule, NgbPaginationModule, BrowserComponent, ThumbnailQRCode],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentBrowserView extends CompositeView implements OnInit, OnDestroy {
    public constructor(
        route: ActivatedRoute,
        api: EndpointsApi,
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
    ) {
        super(route, api, 'Browser');

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('browserToolbar');

    public readonly isEmpty = computed(() => this.count() === 0);

    public ngOnInit(): void {
        this.onInit();
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        const document = this.document();
        if (document === undefined) {
            return EMPTY;
        }

        const endpoint = document.endpoint;
        const id = document.id;
        const href = `/view/Browser?endpoint=${encodeBase64Url(endpoint)}&id=${encodeBase64Url(id)}`;
        if (!this.start.add('Favorite', `B#${endpoint}#${id}`, { endpoint, id, href })) {
            return EMPTY;
        }

        return this.start.save();
    }
}
