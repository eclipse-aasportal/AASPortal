/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { aas, AASContainer, AASDocument, AASWorkspace, stringFormat } from 'common';
import * as lib from 'aas-lib';
import { BehaviorSubject, first, from, map, mergeMap, noop, Observable, Subscription } from 'rxjs';
import { ProjectService } from '../project/project.service';

import { AddEndpointFormComponent } from './add-endpoint-form/add-endpoint-form.component';
import { EndpointSelect, RemoveEndpointFormComponent } from './remove-endpoint-form/remove-endpoint-form.component';
import * as StartActions from './start.actions';
import { State } from './start.state';
import { UploadFormComponent } from './upload-form/upload-form.component';
import { getEndpointType } from 'src/app/configuration';
import { selectFilter, selectIsViewModeList, selectIsViewModeTree, selectShowAll, selectViewMode } from './start.selectors';

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
        private readonly toolbar: lib.ToolbarService,
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

    public viewMode: lib.ViewMode = lib.ViewMode.List;

    public showAll = false;

    public readonly filter: Observable<string>;

    public documents: Observable<AASDocument[]>;

    public workspaces: AASWorkspace[] = [];

    public workspace: AASWorkspace | null = null;

    public allAvailable = true;

    public ngOnInit(): void {
        this.toolbar.setToolbar(this.createToolbar());

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
    }

    public ngOnDestroy(): void {
        this.toolbar.setToolbar();
        this.subscription.unsubscribe();
    }

    public ngAfterViewInit(): void {
        this.subscription.add(this.aasTable?.selectedDocuments.subscribe(
            selectedDocuments => {
                this.selectedDocuments = selectedDocuments;
                this.someSelectedDocuments.next(selectedDocuments.length > 0);
            }));
    }

    public setViewMode(viewMode: string | lib.ViewMode): void {
        this.store.dispatch(StartActions.setViewMode({ viewMode: viewMode as lib.ViewMode }));
    }

    public setShowAll(showAll: boolean): void {
        this.store.dispatch(StartActions.setShowAll({ showAll }));
    }

    public async addEndpoint(): Promise<void> {
        try {
            await this.auth.ensureAuthorizedAsync('editor');
            const modalRef = this.modal.open(AddEndpointFormComponent, { backdrop: 'static' });
            modalRef.componentInstance.workspaces = this.workspaces.map(item => item.name);
            const result: string = await modalRef.result;
            if (result) {
                const url = new URL(result);
                this.project
                    .addEndpoint(url.searchParams.get('name')!, result)
                    .pipe(first())
                    .subscribe({
                        error: (error) => this.notify.error(error),
                    });
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public async removeEndpoint(): Promise<void> {
        if (this.workspaces.length > 0) {
            try {
                await this.auth.ensureAuthorizedAsync('editor');
                const modalRef = this.modal.open(RemoveEndpointFormComponent, { backdrop: 'static' });
                modalRef.componentInstance.endpoints = [...this.workspaces]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(item => ({
                        name: item.name,
                        url: item.containers.map((c, i) => i === 0 ? c.url.split('?')[0] : `${i + 1}`).join(', '),
                        selected: false
                    } as EndpointSelect));

                const results: string[] = await modalRef.result;
                if (results) {
                    from(results).pipe(mergeMap(result => this.project.removeEndpoint(result))).subscribe({
                        error: (error) => this.notify.error(error),
                    });
                }
            } catch (error) {
                if (error) {
                    this.notify.error(error);
                }
            }
        }
    }

    public async reset(): Promise<void> {
        try {
            await this.auth.ensureAuthorizedAsync('editor');
            if (this.window.confirm(this.translate.instant('CONFIRM_RESET_CONFIGURATION'))) {
                this.project.reset().subscribe({
                    error: (error) => this.notify.error(error),
                });
            }
        } catch (error) {
            noop();
        }
    }

    public setWorkspace(name: string): void {
        this.project.setWorkspace(name);
    }

    public canUploadDocument(): boolean {
        return this.getUploadCapableEndpoints().length > 0;
    }

    public async uploadDocument(): Promise<void> {
        try {
            await this.auth.ensureAuthorizedAsync('editor');
            const modalRef = this.modal.open(UploadFormComponent, { backdrop: 'static' });
            const containers = this.getUploadCapableEndpoints();
            modalRef.componentInstance.containers = containers;
            modalRef.componentInstance.container = containers[0];
            const name = await modalRef.result;
            if (typeof name === 'string') {
                this.notify.info('INFO_UPLOAD_AASX_FILE_SUCCESS', name);
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canDownloadDocument(): boolean {
        return this.aasTable && this.selectedDocuments.length > 0 ? true : false;
    }

    public async downloadDocument(): Promise<void> {
        if (this.aasTable) {
            for (const document of this.selectedDocuments) {
                try {
                    await this.download.downloadDocumentAsync(
                        document.idShort + '.aasx',
                        document.id,
                        document.container);
                } catch (error) {
                    this.notify.error(error);
                }
            }
        }
    }

    public canDeleteDocument(): boolean {
        return this.aasTable != null && this.selectedDocuments.length > 0 &&
            this.selectedDocuments.every(
                item => getEndpointType(item.container) === 'AasxDirectory');
    }

    public async deleteDocument(): Promise<void> {
        try {
            await this.auth.ensureAuthorizedAsync('editor');
            if (this.aasTable) {
                if (this.window.confirm(stringFormat(
                    this.translate.instant('CONFIRM_DELETE_DOCUMENT'),
                    this.selectedDocuments.map(item => item.idShort).join(', ')))) {
                    from(this.selectedDocuments).pipe(mergeMap(document => this.project.deleteDocument(document)))
                        .subscribe({
                            error: (error) => this.notify.error(error)
                        });
                }
            }
        } catch (error) {
            this.notify.error(error);
        }
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

    private selectSubmodels(document: AASDocument, semanticId: string): aas.Submodel[] {
        return document.content?.submodels.filter(submodel => lib.resolveSemanticId(submodel) === semanticId) ?? [];
    }

    private getUploadCapableEndpoints(): AASContainer[] {
        return this.workspace?.containers.filter(item => {
            const type = getEndpointType(item.url);
            return type === 'AasxDirectory' || type === 'AasxServer';
        }) ?? [];
    }

    private createToolbar(): lib.Toolbar {
        return {
            groups: [
                this.toolbar.createGroup(
                    [
                        this.toolbar.createDropDown(
                            'bi bi-stack-overflow',
                            this.createMenu(),
                            this.project.workspace.pipe(map(item => item?.name ?? '-'))
                        ),
                        this.toolbar.createDropDown(
                            'bi bi-gear',
                            [
                                this.toolbar.createMenuItem('CMD_ADD_ENDPOINT', () => this.addEndpoint()),
                                this.toolbar.createMenuItem('CMD_REMOVE_ENDPOINT', () => this.removeEndpoint()),
                                this.toolbar.createMenuItem('CMD_RESET_CONFIGURATION', () => this.reset()),
                            ])
                    ]),
                this.toolbar.createGroup(
                    [
                        this.toolbar.createButton('bi bi-upload', () => this.uploadDocument(), () => this.canUploadDocument()),
                        this.toolbar.createButton('bi bi-download', () => this.downloadDocument(), () => this.canDownloadDocument()),
                        this.toolbar.createButton('bi bi-trash', () => this.deleteDocument(), () => this.canDeleteDocument())
                    ]
                ),
                this.toolbar.createGroup(
                    [
                        this.toolbar.createRadio(
                            'bi bi-list',
                            'list',
                            this.store.select(selectIsViewModeList),
                            () => this.setViewMode('list')),
                        this.toolbar.createRadio(
                            'bi bi-diagram-3',
                            'tree',
                            this.store.select(selectIsViewModeTree),
                            () => this.setViewMode('tree'))
                    ]),
                this.toolbar.createGroup(
                    [
                        this.toolbar.createDropDown(
                            '',
                            [
                                this.toolbar.createMenuItem(
                                    'CMD_VIEW_USER_FEEDBACK',
                                    () => this.viewUserFeedback(),
                                    () => this.canViewUserFeedback()),
                                this.toolbar.createMenuItem(
                                    'CMD_VIEW_NAMEPLATE',
                                    () => this.viewNameplate(),
                                    () => this.canViewNameplate())
                            ],
                            'LABEL_VIEWS',
                            this.someSelectedDocuments.asObservable())
                    ]),
                this.toolbar.createGroup(
                    [
                        this.toolbar.createTextInput(
                            'bi bi-filter',
                            this.store.select(selectFilter).pipe(first()),
                            'PLACEHOLDER_FILTER',
                            (filter: string) => this.store.dispatch(StartActions.setFilter({ filter })))
                    ])]
        } as lib.Toolbar;
    }

    private createMenu(): Observable<lib.ToolbarItem[]> {
        return this.project.workspaces.pipe(map(items => items.map(
            item => this.toolbar.createMenuItem(item.name, () => this.setWorkspace(item.name)))));
    }
}