/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { aas, AASDocument, AASEndpoint, stringFormat } from 'common';
import * as lib from 'projects/aas-lib/src/public-api';
import { BehaviorSubject, EMPTY, first, from, map, mergeMap, Observable, of, Subscription } from 'rxjs';

import { AddEndpointFormComponent } from './add-endpoint-form/add-endpoint-form.component';
import { EndpointSelect, RemoveEndpointFormComponent } from './remove-endpoint-form/remove-endpoint-form.component';
import * as StartActions from './start.actions';
import * as StartSelectors from './start.selectors';
import { StartFeatureState } from './start.state';
import { UploadFormComponent } from './upload-form/upload-form.component';
import { ToolbarService } from '../toolbar.service';
import { StartApiService } from './start-api.service';

@Component({
    selector: 'fhg-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.scss'],
})
export class StartComponent implements OnInit, OnDestroy, AfterViewInit {
    private readonly store: Store<StartFeatureState>
    private readonly subscription = new Subscription();
    private readonly someSelectedDocuments = new BehaviorSubject<boolean>(true);
    private _selected: AASDocument[] = [];

    constructor(
        store: Store,
        private readonly router: Router,
        private readonly modal: NgbModal,
        private readonly translate: TranslateService,
        private readonly window: lib.WindowService,
        private readonly api: StartApiService,
        private readonly notify: lib.NotifyService,
        private readonly toolbar: ToolbarService,
        private readonly auth: lib.AuthService,
        private readonly download: lib.DownloadService,
        private readonly clipboard: lib.ClipboardService
    ) {
        this.store = store as Store<StartFeatureState>;
        this.filter = this.store.select(StartSelectors.selectFilter);
        this.limit = this.store.select(StartSelectors.selectLimit);
        this.isFirstPage = this.store.select(StartSelectors.selectIsFirstPage);
        this.isLastPage = this.store.select(StartSelectors.selectIsLastPage);
        this.documents = this.store.select(StartSelectors.selectDocuments);
        this.viewMode = this.store.select(StartSelectors.selectViewMode);
        this.endpoints = this.api.getEndpoints();
    }

    @ViewChild('startToolbar', { read: TemplateRef })
    public startToolbar: TemplateRef<unknown> | null = null;

    public readonly viewMode: Observable<lib.ViewMode>;

    public readonly filter: Observable<string>;

    public readonly limit: Observable<number>;

    public readonly isFirstPage: Observable<boolean>;

    public readonly isLastPage: Observable<boolean>;

    public readonly endpoints: Observable<AASEndpoint[]>;

    public documents: Observable<AASDocument[]>;

    public get selected(): AASDocument[] {
        return this._selected;
    }

    public set selected(values: AASDocument[]) {
        this._selected = values;
        this.someSelectedDocuments.next(values.length > 0);
    }

    public ngOnInit(): void {
        this.store.select(StartSelectors.selectViewMode).pipe(
            first(viewMode => viewMode === lib.ViewMode.Undefined),
            mergeMap(() => this.auth.ready),
            first(ready => ready),
            first(),
        ).subscribe({
            next: () => this.store.dispatch(StartActions.getFirstPage({})),
            error: error => this.notify.error(error),
        });
    }

    public ngAfterViewInit(): void {
        if (this.startToolbar) {
            this.toolbar.set(this.startToolbar);
        }
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
        this.subscription.unsubscribe();
    }

    public setViewMode(viewMode: string | lib.ViewMode): void {
        if (viewMode === lib.ViewMode.List) {
            this.store.dispatch(StartActions.getFirstPage({}));
        } else {
            this.store.dispatch(StartActions.getHierarchy({ roots: this._selected }));
        }
    }

    public addEndpoint(): void {
        this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => this.api.getEndpoints()),
            map(endpoints => {
                const modalRef = this.modal.open(AddEndpointFormComponent, { backdrop: 'static' });
                modalRef.componentInstance.workspaces = endpoints;
                return modalRef;
            }),
            mergeMap(modalRef => from<Promise<AASEndpoint | undefined>>(modalRef.result)),
            mergeMap((result) => {
                if (!result) return EMPTY;

                return this.api.addEndpoint(result);
            })).subscribe({ error: (error) => this.notify.error(error) });
    }

    public removeEndpoint(): void {
        this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => this.api.getEndpoints()),
            mergeMap(endpoints => {
                const modalRef = this.modal.open(RemoveEndpointFormComponent, { backdrop: 'static' });
                modalRef.componentInstance.endpoints = endpoints
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(item => ({
                        name: item.name,
                        url: item.url,
                        selected: false
                    } as EndpointSelect));
                return from<Promise<string[] | undefined>>(modalRef.result);
            }),
            mergeMap((endpoints) => from((endpoints ?? []))),
            mergeMap((endpoint) => this.api.removeEndpoint(endpoint)))
            .subscribe({ error: (error) => this.notify.error(error) });
    }

    public reset(): void {
        this.auth.ensureAuthorized('editor').pipe(
            map(() => this.window.confirm(this.translate.instant('CONFIRM_RESET_CONFIGURATION'))),
            mergeMap((result) => {
                if (!result) return of(void 0);

                return this.api.reset();
            })).subscribe({ error: (error) => this.notify.error(error) });
    }

    public canUploadDocument(): boolean {
        return true;
    }

    public uploadDocument(): void {
        this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => this.api.getEndpoints()),
            mergeMap(endpoints => {
                const modalRef = this.modal.open(UploadFormComponent, { backdrop: 'static' });
                modalRef.componentInstance.endpoints = endpoints.sort((a, b) => a.name.localeCompare(b.name));
                modalRef.componentInstance.endpoint = endpoints[0];
                return from<Promise<string | undefined>>(modalRef.result);
            })).subscribe({
                next: (result) => {
                    if (result) {
                        this.notify.info('INFO_UPLOAD_AASX_FILE_SUCCESS', result);
                    }
                },
                error: (error) => this.notify.error(error)
            });
    }

    public canDownloadDocument(): boolean {
        return this._selected.length > 0 ? true : false;
    }

    public downloadDocument(): void {
        for (const document of this._selected) {
            this.download.downloadDocument(
                document.endpoint,
                document.id,
                document.idShort + '.aasx').subscribe({ error: (error) => this.notify.error(error) });
        }
    }

    public canDeleteDocument(): boolean {
        return this._selected.length > 0;
    }

    public deleteDocument(): void {
        if (this._selected.length === 0) return;

        this.auth.ensureAuthorized('editor').pipe(
            map(() => this.window.confirm(stringFormat(
                this.translate.instant('CONFIRM_DELETE_DOCUMENT'),
                this._selected.map(item => item.idShort).join(', ')))),
            mergeMap((result) => from(result ? this._selected : [])),
            mergeMap((document) => this.api.delete(document.id, document.endpoint)))
            .subscribe({ error: (error) => this.notify.error(error) });
    }

    public canViewUserFeedback(): boolean {
        return this._selected.some(document => this.selectSubmodels(document, lib.CustomerFeedback).length === 1);
    }

    public viewUserFeedback(): void {
        const descriptor: lib.SubmodelViewDescriptor = {
            template: lib.supportedSubmodelTemplates.get(lib.CustomerFeedback),
            submodels: []
        };

        for (const document of this._selected) {
            const submodels = this.selectSubmodels(document, lib.CustomerFeedback);
            if (submodels.length === 1) {
                descriptor.submodels.push({
                    id: document.id,
                    endpoint: document.endpoint,
                    idShort: submodels[0].idShort
                });
            }
        }

        if (descriptor.submodels.length > 0) {
            this.clipboard.set('ViewQuery', { descriptor } as lib.ViewQuery)
            this.router.navigateByUrl('/view?format=ViewQuery');
        }
    }

    public canViewNameplate(): boolean {
        return this._selected.some(document => this.selectSubmodels(document, lib.ZVEINameplate).length === 1);
    }

    public viewNameplate(): void {
        const descriptor: lib.SubmodelViewDescriptor = {
            template: lib.supportedSubmodelTemplates.get(lib.ZVEINameplate),
            submodels: []
        };

        for (const document of this._selected) {
            const submodels = this.selectSubmodels(document, lib.ZVEINameplate);
            if (submodels.length === 1) {
                descriptor.submodels.push({
                    id: document.id,
                    endpoint: document.endpoint,
                    idShort: submodels[0].idShort
                });
            }
        }

        if (descriptor.submodels.length > 0) {
            this.clipboard.set('ViewQuery', { descriptor } as lib.ViewQuery)
            this.router.navigateByUrl('/view?format=ViewQuery');
        }
    }

    public setFilter(filter: string): void {
        this.store.dispatch(StartActions.getFirstPage({ filter }));
    }

    public setLimit(limit: number): void {
        this.store.dispatch(StartActions.getFirstPage({ limit }));
    }

    public firstPage(): void {
        this.store.dispatch(StartActions.getFirstPage({}));
    }

    public previousPage(): void {
        this.store.dispatch(StartActions.getPreviousPage())
    }

    public nextPage(): void {
        this.store.dispatch(StartActions.getNextPage())
    }

    public lastPage(): void {
        this.store.dispatch(StartActions.getLastPage())
    }

    private selectSubmodels(document: AASDocument, semanticId: string): aas.Submodel[] {
        return document.content?.submodels.filter(submodel => lib.resolveSemanticId(submodel) === semanticId) ?? [];
    }
}