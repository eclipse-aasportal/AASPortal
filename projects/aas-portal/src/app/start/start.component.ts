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
import { aas, AASContainer, AASDocument, AASWorkspace, stringFormat } from 'common';
import * as lib from 'projects/aas-lib/src/public-api';
import { BehaviorSubject, first, from, map, mergeMap, Observable, of, Subscription } from 'rxjs';
import { ProjectService } from '../project/project.service';

import { AddEndpointFormComponent } from './add-endpoint-form/add-endpoint-form.component';
import { EndpointSelect, RemoveEndpointFormComponent } from './remove-endpoint-form/remove-endpoint-form.component';
import * as StartActions from './start.actions';
import { State } from './start.state';
import { UploadFormComponent } from './upload-form/upload-form.component';
import { getEndpointType } from '../configuration';
import { selectFilter, selectShowAll, selectViewMode } from './start.selectors';
import { ToolbarService } from '../toolbar.service';

@Component({
    selector: 'fhg-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.scss'],
})
export class StartComponent implements OnInit, OnDestroy, AfterViewInit {
    private readonly store: Store<State>
    private readonly subscription = new Subscription();
    private readonly someSelectedDocuments = new BehaviorSubject<boolean>(true);
    private selectedDocuments: AASDocument[] = [];

    constructor(
        store: Store,
        private readonly router: Router,
        private readonly modal: NgbModal,
        private readonly translate: TranslateService,
        private readonly window: lib.WindowService,
        private readonly project: ProjectService,
        private readonly notify: lib.NotifyService,
        private readonly toolbar: ToolbarService,
        private readonly auth: lib.AuthService,
        private readonly download: lib.DownloadService,
        private readonly clipboard: lib.ClipboardService
    ) {
        this.store = store as Store<State>;
        this.filter = this.store.select(selectFilter);
        this.documents = this.project.documents;
    }

    @ViewChild('aasTable')
    public aasTable: lib.AASTable | null = null;

    @ViewChild('startToolbar', { read: TemplateRef })
    public startToolbar: TemplateRef<unknown> | null = null;

    public viewMode: lib.ViewMode = lib.ViewMode.List;

    public showAll = false;

    public readonly filter: Observable<string>;

    public documents: Observable<AASDocument[]>;

    public workspaces: AASWorkspace[] = [];

    public workspace: AASWorkspace | null = null;

    public allAvailable = true;

    public readonly endpoint = this.project.workspace.pipe(map(item => item?.name ?? '-'));

    public readonly endpoints = this.project.workspaces;

    public ngOnInit(): void {
        this.subscription.add(
            this.store
                .select(selectShowAll).pipe()
                .subscribe((value) => {
                    this.showAll = value;
                })
        );

        this.subscription.add(
            this.store
                .select(selectViewMode).pipe()
                .subscribe((value) => {
                    this.viewMode = value;
                })
        );

        this.subscription.add(
            this.project.workspace.subscribe((value) => {
                this.workspace = value;
            })
        );

        this.subscription.add(
            this.project.workspaces.subscribe((value) => {
                this.workspaces = value;
            })
        );

        this.subscription.add(
            this.project.documents.subscribe(
                (documents) => (this.allAvailable = documents.every((item) => item.content)))
        );

        this.subscription.add(this.aasTable?.selectedDocuments.subscribe(
            selectedDocuments => {
                this.selectedDocuments = selectedDocuments;
                this.someSelectedDocuments.next(selectedDocuments.length > 0);
            }));
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
        this.store.dispatch(StartActions.setViewMode({ viewMode: viewMode as lib.ViewMode }));
    }

    public setShowAll(showAll: boolean): void {
        this.store.dispatch(StartActions.setShowAll({ showAll }));
    }

    public addEndpoint(): void {
        this.auth.ensureAuthorized('editor').pipe(
            map(() => this.modal.open(AddEndpointFormComponent, { backdrop: 'static' })),
            mergeMap((modalRef) => {
                modalRef.componentInstance.workspaces = this.workspaces.map(item => item.name);
                return from<Promise<string | undefined>>(modalRef.result)
            }),
            map((result) => {
                if (!result) return;

                const url = new URL(result);
                this.project
                    .addEndpoint(url.searchParams.get('name')!, result)
                    .pipe(first())
                    .subscribe({
                        error: (error) => this.notify.error(error),
                    });
            })).subscribe({ error: (error) => this.notify.error(error) });
    }

    public removeEndpoint(): void {
        if (this.workspaces.length <= 0) return;

        this.auth.ensureAuthorized('editor').pipe(
            map(() => this.modal.open(RemoveEndpointFormComponent, { backdrop: 'static' })),
            mergeMap((modalRef) => {
                modalRef.componentInstance.endpoints = [...this.workspaces]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(item => ({
                        name: item.name,
                        url: item.containers.map((c, i) => i === 0 ? c.url.split('?')[0] : `${i + 1}`).join(', '),
                        selected: false
                    } as EndpointSelect));
                return from<Promise<string[] | undefined>>(modalRef.result);
            }),
            mergeMap((endpoints) => from((endpoints ?? []))),
            mergeMap((endpoint) => this.project.removeEndpoint(endpoint)))
            .subscribe({ error: (error) => this.notify.error(error) });
    }

    public reset(): void {
        this.auth.ensureAuthorized('editor').pipe(
            map(() => this.window.confirm(this.translate.instant('CONFIRM_RESET_CONFIGURATION'))),
            mergeMap((result) => {
                if (!result) return of(void 0);

                return this.project.reset();
            })).subscribe({ error: (error) => this.notify.error(error) });
    }

    public setWorkspace(name: string): void {
        this.project.setWorkspace(name);
    }

    public canUploadDocument(): boolean {
        return this.getUploadCapableEndpoints().length > 0;
    }

    public uploadDocument(): void {
        this.auth.ensureAuthorized('editor').pipe(
            map(() => this.modal.open(UploadFormComponent, { backdrop: 'static' })),
            mergeMap((modalRef) => {
                const containers = this.getUploadCapableEndpoints();
                modalRef.componentInstance.containers = containers;
                modalRef.componentInstance.container = containers[0];
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
        return this.aasTable && this.selectedDocuments.length > 0 ? true : false;
    }

    public downloadDocument(): void {
        if (!this.aasTable) return;

        for (const document of this.selectedDocuments) {
            this.download.downloadDocument(
                document.idShort + '.aasx',
                document.id,
                document.container).subscribe({ error: (error) => this.notify.error(error) });
        }
    }

    public canDeleteDocument(): boolean {
        return this.aasTable != null && this.selectedDocuments.length > 0 &&
            this.selectedDocuments.every(
                item => getEndpointType(item.container) === 'AasxDirectory');
    }

    public deleteDocument(): void {
        if (!this.aasTable || this.selectedDocuments.length === 0) return;

        this.auth.ensureAuthorized('editor').pipe(
            map(() => this.window.confirm(stringFormat(
                this.translate.instant('CONFIRM_DELETE_DOCUMENT'),
                this.selectedDocuments.map(item => item.idShort).join(', ')))),
            mergeMap((result) => from(result ? this.selectedDocuments : [])),
            mergeMap((document) => this.project.deleteDocument(document)))
            .subscribe({ error: (error) => this.notify.error(error) });
    }

    public canViewUserFeedback(): boolean {
        return this.selectedDocuments.some(document => this.selectSubmodels(document, lib.CustomerFeedback).length === 1);
    }

    public viewUserFeedback(): void {
        const descriptor: lib.SubmodelViewDescriptor = {
            template: lib.supportedSubmodelTemplates.get(lib.CustomerFeedback),
            submodels: []
        };

        for (const document of this.selectedDocuments) {
            const submodels = this.selectSubmodels(document, lib.CustomerFeedback);
            if (submodels.length === 1) {
                descriptor.submodels.push({
                    id: document.id,
                    url: document.container,
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
        return this.selectedDocuments.some(document => this.selectSubmodels(document, lib.ZVEINameplate).length === 1);
    }

    public viewNameplate(): void {
        const descriptor: lib.SubmodelViewDescriptor = {
            template: lib.supportedSubmodelTemplates.get(lib.ZVEINameplate),
            submodels: []
        };

        for (const document of this.selectedDocuments) {
            const submodels = this.selectSubmodels(document, lib.ZVEINameplate);
            if (submodels.length === 1) {
                descriptor.submodels.push({
                    id: document.id,
                    url: document.container,
                    idShort: submodels[0].idShort
                });
            }
        }

        if (descriptor.submodels.length > 0) {
            this.clipboard.set('ViewQuery', { descriptor } as lib.ViewQuery)
            this.router.navigateByUrl('/view?format=ViewQuery');
        }
    }

    public applyFilter(filter: string): void {
        this.store.dispatch(StartActions.setFilter({ filter }));
    }

    private selectSubmodels(document: AASDocument, semanticId: string): aas.Submodel[] {
        return document.content?.submodels.filter(submodel => lib.resolveSemanticId(submodel) === semanticId) ?? [];
    }

    private getUploadCapableEndpoints(): AASContainer[] {
        return this.workspace?.containers.filter(item => {
            const type = getEndpointType(item.url);
            return type === 'AasxDirectory' || type === 'AasxServer';
        }) ?? [];
    }
}