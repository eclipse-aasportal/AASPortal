/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Observable, of } from 'rxjs';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Component, effect, inject, OnDestroy, TemplateRef, viewChild } from '@angular/core';

import { encodeBase64Url } from '../../utilities';
import { ToolbarService } from '../../shared/services/toolbar.service';
import { StartService } from '../../shared/services/start.service';
import { BrowserComponent } from '../../components/browser/browser.component';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { DocumentBrowserViewState } from './document-browser-view.state';
import { CompositeView } from '../composite-view';
import { VIEW_ROUTE_NAME } from '../view-route-name';

@Component({
    selector: 'fhg-doc-browser',
    templateUrl: './document-browser-view.html',
    styleUrl: './document-browser-view.scss',
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'Browser' }],
    imports: [TranslateDirective, TranslatePipe, NgbPaginationModule, BrowserComponent, ThumbnailQRCode],
})
/**
 * The `DocumentBrowserView` component displays an AAS document in a hierarchical structure using the `BrowserComponent`.
 * It allows users to navigate through the AAS environment, view element properties, and explore related concept descriptions.
 * This view extends the `CompositeView` and integrates with the `ToolbarService` to provide a customizable toolbar.
 */
export class DocumentBrowserView extends CompositeView implements OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);
    private readonly state = inject(DocumentBrowserViewState);

    public constructor() {
        super();

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    /**
     * A `TemplateRef` for the browser toolbar. It is used to set the toolbar content.
     */
    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('browserToolbar');

    /**
     * The `BrowserState` instance used by the `BrowserComponent` to manage the browsing state.
     */
    public readonly browserState = this.state.browserState;

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
        const href = `/views/Browser;endpoint=${encodeBase64Url(endpoint)};id=${encodeBase64Url(id)}`;
        if (!this.start.add('Favorite', `DBV#${endpoint}#${id}`, { endpoint, id, href })) {
            return of(void 0);
        }

        return this.start.save();
    }
}
