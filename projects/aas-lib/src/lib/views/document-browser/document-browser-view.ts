/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
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

import { encodeBase64Url } from '../../utilities';
import { EndpointsApi } from '../../services/endpoints-api';
import { ToolbarService } from '../../services/toolbar.service';
import { StartService } from '../../services/start.service';
import { BrowserComponent } from '../../components/browser/browser.component';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { VIEW_ROUTES } from '../../types';
import { DocumentBrowserViewState } from './document-browser-view.state';
import { CompositeView } from '../composite-view';

@Component({
    selector: 'fhg-doc-browser',
    templateUrl: './document-browser-view.html',
    styleUrl: './document-browser-view.scss',
    imports: [TranslateModule, NgbPaginationModule, BrowserComponent, ThumbnailQRCode],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * The `DocumentBrowserView` component displays an AAS document in a hierarchical structure using the `BrowserComponent`.
 * It allows users to navigate through the AAS environment, view element properties, and explore related concept descriptions.
 * This view extends the `CompositeView` and integrates with the `ToolbarService` to provide a customizable toolbar.
 */
export class DocumentBrowserView extends CompositeView<DocumentBrowserViewState> implements OnInit, OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);

    public constructor() {
        super(
            inject(ActivatedRoute),
            inject(EndpointsApi),
            inject(VIEW_ROUTES),
            'Browser',
            inject(DocumentBrowserViewState),
        );

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

    public ngOnInit(): void {
        this.onInit();
    }

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
