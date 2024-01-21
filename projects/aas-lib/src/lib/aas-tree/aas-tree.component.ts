/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { BehaviorSubject, Subscription, Observable, first } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
    aas,
    LiveNode,
    LiveRequest,
    WebSocketData,
    AASDocument,
    convertToString,
    toLocale,
    EndpointType,
    selectSubmodel,
    getIdShortPath,
    mimeTypeToExtension,
    AASEndpointType,
} from 'common';

import { AASTreeRow, AASTreeFeatureState } from './aas-tree.state';
import { OnlineState } from '../types/online-state';
import { ShowImageFormComponent } from './show-image-form/show-image-form.component';
import { ShowVideoFormComponent } from './show-video-form/show-video-form.component';
import { OperationCallFormComponent } from './operation-call-form/operation-call-form.component';
import { AASTreeSearch } from './aas-tree-search';
import { basename, encodeBase64Url } from '../convert';
import { AASQuery } from '../types/aas-query-params';
import { ViewQuery } from '../types/view-query-params';
import { WindowService } from '../window.service';
import { DocumentService } from '../document.service';
import { DownloadService } from '../download.service';
import { WebSocketFactoryService } from '../web-socket-factory.service';
import { ClipboardService } from '../clipboard.service';
import { LogType, NotifyService } from '../notify/notify.service';
import {
    SubmodelViewDescriptor,
    resolveSemanticId,
    supportedSubmodelTemplates,
} from '../submodel-template/submodel-template';
import * as AASTreeActions from './aas-tree.actions';
import * as AASTreeSelectors from './aas-tree.selectors';
import { AASTreeApiService } from './aas-tree-api.service';

interface PropertyValue {
    property: aas.Property;
    value: BehaviorSubject<string | boolean>;
}

@Component({
    selector: 'fhg-aas-tree',
    templateUrl: './aas-tree.component.html',
    styleUrls: ['./aas-tree.component.scss'],
    providers: [AASTreeSearch],
})
export class AASTreeComponent implements OnInit, OnChanges, OnDestroy {
    private readonly store: Store<AASTreeFeatureState>;
    private readonly liveNodes: LiveNode[] = [];
    private readonly map = new Map<string, PropertyValue>();
    private readonly subscription = new Subscription();
    private _selected: aas.Referable[] = [];
    private shiftKey = false;
    private altKey = false;

    private webSocketSubject?: WebSocketSubject<WebSocketData>;

    public constructor(
        private readonly router: Router,
        store: Store,
        private readonly api: AASTreeApiService,
        private readonly searching: AASTreeSearch,
        private readonly modal: NgbModal,
        private readonly window: WindowService,
        private readonly dom: DocumentService,
        private readonly download: DownloadService,
        private readonly translate: TranslateService,
        private readonly notify: NotifyService,
        private readonly webSocketFactory: WebSocketFactoryService,
        private readonly clipboard: ClipboardService,
    ) {
        this.store = store as Store<AASTreeFeatureState>;
        this.nodes = this.store.select(AASTreeSelectors.selectNodes);
        this.someSelected = this.store.select(AASTreeSelectors.selectSomeSelected);
        this.everySelected = this.store.select(AASTreeSelectors.selectEverySelected);

        this.subscription.add(
            this.store
                .select(AASTreeSelectors.selectSelectedElements)
                .pipe()
                .subscribe(elements => {
                    this._selected = elements;
                    this.selectedChange.emit(elements);
                }),
        );

        this.window.addEventListener('keyup', this.keyup);
        this.window.addEventListener('keydown', this.keydown);
    }

    @Input()
    public document: AASDocument | null = null;

    @Input()
    public state: OnlineState | null = 'offline';

    @Input()
    public search: Observable<string> | null = null;

    @Input()
    public get selected(): aas.Referable[] {
        return this._selected;
    }

    public set selected(values: aas.Referable[]) {
        this.store.dispatch(AASTreeActions.setSelectedElements({ elements: values }));
    }

    @Output()
    public selectedChange = new EventEmitter<aas.Referable[]>();

    public get onlineReady(): boolean {
        return this.document?.onlineReady ?? false;
    }

    public get readonly(): boolean {
        return this.document?.readonly ?? true;
    }

    public get modified(): boolean {
        return this.document?.modified ?? false;
    }

    public someSelected: Observable<boolean>;

    public everySelected: Observable<boolean>;

    public nodes: Observable<AASTreeRow[]>;

    public ngOnInit(): void {
        this.subscription.add(
            this.store
                .select(AASTreeSelectors.selectError)
                .pipe()
                .subscribe(error => {
                    if (error) {
                        this.notify.error(error);
                    }
                }),
        );

        this.subscription.add(
            this.store
                .select(AASTreeSelectors.selectMatchIndex)
                .pipe()
                .subscribe(index => {
                    if (index >= 0) {
                        this.store.dispatch(AASTreeActions.expandRow({ arg: index }));
                    }
                }),
        );

        this.subscription.add(
            this.store
                .select(AASTreeSelectors.selectMatchRow)
                .pipe()
                .subscribe(row => {
                    if (row) {
                        setTimeout(() => {
                            const element = this.dom.getElementById(row.id);
                            element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                        });
                    }
                }),
        );

        this.subscription.add(
            this.translate.onLangChange.subscribe(() => {
                this.store.dispatch(
                    AASTreeActions.updateRows({
                        document: this.document,
                        localeId: this.translate.currentLang,
                    }),
                );
            }),
        );
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['document']) {
            this.store.dispatch(
                AASTreeActions.updateRows({
                    document: this.document,
                    localeId: this.translate.currentLang,
                }),
            );
        }

        if (changes['search'] && this.search) {
            this.subscription.add(this.search.subscribe(value => this.searching.start(value)));
        }

        const stateChange = changes['state'];
        if (stateChange) {
            if (stateChange.previousValue !== stateChange.currentValue) {
                if (this.state === 'online') {
                    this.goOnline();
                } else {
                    this.goOffline();
                }
            }
        }
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.webSocketSubject?.unsubscribe();
        this.searching?.destroy();
        this.window.removeEventListener('keyup', this.keyup);
        this.window.removeEventListener('keydown', this.keydown);
    }

    public visualState(node: AASTreeRow): string {
        let state = '';
        if (node.selected) {
            state = 'table-primary';
            if (node.highlighted) {
                state += ' table-success';
            }
        } else if (node.highlighted) {
            state = 'table-success';
        }

        return state;
    }

    public getValue(node: AASTreeRow): string | boolean | undefined {
        if (this.state === 'online' && node.element.modelType === 'Property') {
            const property = node.element as aas.Property;
            let value: string | boolean;
            const item = property.nodeId && this.map.get(property.nodeId);
            if (item) {
                value = item.value.getValue();
            } else {
                value = this.getPropertyValue(property);
            }

            return value;
        } else {
            return node.value;
        }
    }

    public expand(node: AASTreeRow): void {
        if (!node.expanded) {
            this.store.dispatch(AASTreeActions.expandRow({ arg: node }));
        }
    }

    public collapse(node?: AASTreeRow): void {
        if (node) {
            if (node.expanded) {
                this.store.dispatch(AASTreeActions.collapseRow({ row: node }));
            }
        } else {
            this.store.dispatch(AASTreeActions.collapse());
        }
    }

    public toggleSelections(): void {
        this.store.dispatch(AASTreeActions.toggleSelections());
    }

    public toggleSelection(node: AASTreeRow): void {
        this.store.dispatch(AASTreeActions.toggleSelected({ row: node, altKey: this.altKey, shiftKey: this.shiftKey }));
    }

    public open(node: AASTreeRow): void {
        try {
            switch (node.element.modelType) {
                case 'File':
                    this.openFileAsync(node.element as aas.File);
                    break;
                case 'Blob':
                    this.openBlobAsync(node.element as aas.Blob);
                    break;
                case 'Entity':
                    if (this.state === 'offline') {
                        this.openEntity(node.element);
                    } else {
                        this.notify.info('ToDo...');
                    }
                    break;
                case 'ReferenceElement':
                    if (this.state === 'offline') {
                        this.openReference(node.element);
                    } else {
                        this.notify.info('ToDo...');
                    }
                    break;
                case 'Operation':
                    this.callOperationAsync(node.element as aas.Operation);
                    break;
                case 'Property': {
                    const property = node.element as aas.Property;
                    this.window.open(String(property.value));
                    break;
                }
                case 'Submodel':
                    this.navigateToView(node.element as aas.Submodel);
                    break;
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public findNext(): void {
        this.searching.findNext();
    }

    public findPrevious(): void {
        this.searching.findPrevious();
    }

    private navigateToView(submodel: aas.Submodel): void {
        const semanticId = resolveSemanticId(submodel);
        if (semanticId) {
            const template = supportedSubmodelTemplates.get(semanticId);
            if (template && this.document) {
                const descriptor: SubmodelViewDescriptor = {
                    template,
                    submodels: [
                        {
                            id: this.document.id,
                            endpoint: this.document.endpoint,
                            idShort: submodel.idShort,
                        },
                    ],
                };

                this.clipboard.set('ViewQuery', { descriptor } as ViewQuery);
                this.router.navigateByUrl('/view?format=ViewQuery', { skipLocationChange: true });
            }
        }
    }

    private async openFileAsync(file: aas.File): Promise<void> {
        if (file.value) {
            const { name, url } = this.resolveFile(file);
            if (name && url) {
                if (file.contentType.startsWith('image/')) {
                    await this.showImageAsync(name, url);
                } else if (file.contentType.startsWith('video/')) {
                    await this.showVideoAsync(name, url);
                } else if (file.contentType.endsWith('/pdf')) {
                    const token = await this.api.getTokenAsync(url);
                    this.window.open(url + '?access_token=' + token);
                } else if (file) {
                    await this.downloadFileAsync(name, url);
                }
            }
        }
    }

    private async openBlobAsync(blob: aas.Blob): Promise<void> {
        if (blob.contentType && this.document && blob.parent) {
            const extension = mimeTypeToExtension(blob.contentType);
            if (extension) {
                const name = blob.idShort + extension;
                if (blob.value) {
                    if (blob.contentType.startsWith('image/')) {
                        await this.showImageAsync(name, `data:${blob.contentType};base64,${blob.value}`);
                    } else if (blob.contentType.startsWith('video/')) {
                        await this.showVideoAsync(name, `data:${blob.contentType};base64,${blob.value}`);
                    }
                } else {
                    const endpoint = encodeBase64Url(this.document.endpoint);
                    const id = encodeBase64Url(this.document.id);
                    const smId = encodeBase64Url(blob.parent.keys[0].value);
                    const path = getIdShortPath(blob);
                    const url = `/api/v1/containers/${endpoint}/documents/${id}/submodels/${smId}/blobs/${path}/value`;
                    if (blob.contentType.startsWith('image/')) {
                        await this.showImageAsync(name, url);
                    } else if (blob.contentType.startsWith('video/')) {
                        await this.showVideoAsync(name, url);
                    } else if (blob.contentType.endsWith('/pdf')) {
                        this.window.open(url);
                    } else if (blob) {
                        await this.downloadFileAsync(name, url);
                    }
                }
            }
        }
    }

    private openEntity(element: aas.Referable): void {
        const entity = element as aas.Entity;
        if (entity && entity.globalAssetId) {
            this.clipboard.set('AASQuery', { id: entity.globalAssetId } as AASQuery);
            this.router.navigateByUrl('/aas?format=AASQuery', { skipLocationChange: true });
        }
    }

    private openReference(element: aas.Referable): void {
        const referenceElement = element as aas.ReferenceElement;
        if (referenceElement && referenceElement.value) {
            this.clipboard.set('AASQuery', { id: referenceElement.value.keys[0].value } as AASQuery);
            this.router.navigateByUrl('/aas?format=AASQuery', { skipLocationChange: true });
        }
    }

    private async showImageAsync(name: string, src: string): Promise<void> {
        try {
            const modalRef = this.modal.open(ShowImageFormComponent, { backdrop: 'static' });
            modalRef.componentInstance.name = name;
            modalRef.componentInstance.image = src;
            await modalRef.result;
        } catch (error) {
            if (error) {
                this.notify.error(error);
            }
        }
    }

    private async showVideoAsync(name: string, src: string): Promise<void> {
        try {
            const modalRef = this.modal.open(ShowVideoFormComponent, { backdrop: 'static' });
            modalRef.componentInstance.name = name;
            modalRef.componentInstance.video = src;
            await modalRef.result;
        } catch (error) {
            if (error) {
                this.notify.error(error);
            }
        }
    }

    private async downloadFileAsync(name: string, url: string): Promise<void> {
        try {
            this.download.downloadFileAsync(url, name);
        } catch (error) {
            this.notify.error(error);
        }
    }

    private async callOperationAsync(operation: aas.Operation): Promise<void> {
        try {
            if (operation) {
                const modalRef = this.modal.open(OperationCallFormComponent, { backdrop: 'static' });
                modalRef.componentInstance.document = this.document;
                modalRef.componentInstance.operation = operation;
                await modalRef.result;
            }
        } catch (error) {
            if (error) {
                this.notify.error(error);
            }
        }
    }

    private getPropertyValue(property: aas.Property): string | boolean {
        if (typeof property.value === 'boolean') {
            return property.value;
        } else {
            return toLocale(property.value, property.valueType, this.translate.currentLang) ?? '-';
        }
    }

    private goOnline(): void {
        try {
            this.store
                .select(AASTreeSelectors.selectSelectedRows)
                .pipe(first())
                .subscribe({
                    next: rows => {
                        this.prepareOnline(rows);
                        this.play();
                    },
                    error: () => this.stop(),
                });
        } catch (error) {
            this.stop();
        }
    }

    private goOffline(): void {
        this.stop();
    }

    private play(): void {
        if (this.document) {
            this.webSocketSubject = this.webSocketFactory.create();
            this.webSocketSubject.subscribe({
                next: this.onMessage,
                error: this.onError,
            });

            this.webSocketSubject.next(this.createMessage(this.document));
        }
    }

    private toEndpointType(type: AASEndpointType): EndpointType {
        switch (type) {
            case 'OpcuaServer':
                return 'opc';
            case 'AasxDirectory':
                return 'file';
            default:
                return 'http';
        }
    }

    private stop(): void {
        if (this.webSocketSubject) {
            this.webSocketSubject.unsubscribe();
            this.webSocketSubject = undefined;
        }
    }

    private prepareOnline(rows: AASTreeRow[]): void {
        if (this.document) {
            this.liveNodes.splice(0, this.liveNodes.length);
            this.map.clear();
            for (const row of rows) {
                if (row.selected) {
                    const property = row.element as aas.Property;
                    if (property.nodeId) {
                        this.liveNodes.push({
                            nodeId: property.nodeId,
                            valueType: property.valueType ?? 'undefined',
                        });

                        const subject = new BehaviorSubject<string | boolean>(this.getPropertyValue(property));
                        this.map.set(property.nodeId, { property: property, value: subject });
                    }
                }
            }
        }
    }

    private createMessage(document: AASDocument): WebSocketData {
        return {
            type: 'LiveRequest',
            data: { endpoint: document.endpoint, id: document.id, nodes: this.liveNodes } as LiveRequest,
        };
    }

    private onMessage = (data: WebSocketData): void => {
        if (data.type === 'LiveNode[]') {
            for (const node of data.data as LiveNode[]) {
                const item = this.map.get(node.nodeId);
                if (item) {
                    item.value.next(
                        typeof node.value === 'boolean'
                            ? node.value
                            : convertToString(node.value, this.translate.currentLang),
                    );
                }
            }
        }
    };

    private onError = (error: unknown): void => {
        this.notify.log(LogType.Error, error);
    };

    private keyup = () => {
        this.shiftKey = false;
        this.altKey = false;
    };

    private keydown = (event: KeyboardEvent) => {
        this.shiftKey = event.shiftKey;
        this.altKey = event.altKey;
    };

    private resolveFile(file: aas.File): { url?: string; name?: string } {
        const value: { url?: string; name?: string } = {};
        if (this.document?.content && file.value) {
            const submodel = selectSubmodel(this.document.content, file);
            if (submodel) {
                const smId = encodeBase64Url(submodel.id);
                const path = getIdShortPath(file);
                value.name = basename(file.value);
                const name = encodeBase64Url(this.document.endpoint);
                const id = encodeBase64Url(this.document.id);
                value.url = `/api/v1/containers/${name}/documents/${id}/submodels/${smId}/submodel-elements/${path}/value`;
            }
        }

        return value;
    }
}