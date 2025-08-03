/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgClass, NgStyle } from '@angular/common';
import { Route, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
    ChangeDetectionStrategy,
    Component,
    Inject,
    OnDestroy,
    OnInit,
    computed,
    effect,
    input,
    output,
    DOCUMENT,
} from '@angular/core';

import {
    aas,
    LiveNode,
    LiveRequest,
    WebSocketData,
    AASDocument,
    convertToString,
    selectSubmodel,
    getIdShortPath,
    stringFormat,
    isFile,
    isBlob,
    isReferenceElement,
    isOperation,
    isSubmodel,
    equalDocument,
    isAssetAdministrationShell,
} from 'aas-core';

import { AASTree, AASTreeNode } from './aas-tree-node';
import { OnlineState } from '../../types';
import { AASTreeSearch } from './aas-tree-search';
import { basename, encodeBase64Url } from '../../utilities';
import { WebSocketFactoryService } from '../../services/web-socket-factory.service';
import { LogType, NotifyService } from '../notify/notify.service';
import { findRouteForShell, findRouteForSubmodel } from '../../views/views-utilities';

import { AASTreeApiService } from './aas-tree-api.service';
import { AASTreeStore } from './aas-tree.store';
import { WINDOW, WindowService } from '../../services/window.service';

@Component({
    selector: 'fhg-aas-tree',
    templateUrl: './aas-tree.component.html',
    styleUrls: ['./aas-tree.component.scss'],
    imports: [RouterLink, NgClass, NgStyle, TranslateModule],
    providers: [AASTreeSearch, AASTreeApiService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AASTreeComponent implements OnInit, OnDestroy {
    private readonly liveNodes: LiveNode[] = [];
    private readonly map = new Map<string, AASTreeNode>();
    private readonly subscription = new Subscription();

    private webSocketSubject?: WebSocketSubject<WebSocketData>;

    public constructor(
        private readonly store: AASTreeStore,
        private readonly searching: AASTreeSearch,
        @Inject(WINDOW) private readonly window: WindowService,
        @Inject(DOCUMENT) private readonly dom: Document,
        private readonly translate: TranslateService,
        private readonly notify: NotifyService,
        private readonly webSocketFactory: WebSocketFactoryService,
    ) {
        effect(() => {
            this.searching.start(this.searchExpression());
        });

        effect(() => {
            const document = this.document();
            if (!equalDocument(document, this.store.document)) {
                this.store.document = document;
                this.updateRows(document);
            }
        });

        effect(() => {
            if (this.state() === 'online') {
                this.goOnline();
            } else {
                this.goOffline();
            }
        });

        effect(() => {
            this.selected.emit(this.store.selectedElements$());
        });

        effect(() => {
            const matchIndex = this.matchIndex();
            if (matchIndex >= 0) {
                this.store.expandRow(matchIndex);
            }
        });

        effect(() => {
            const row = this.matchRow();
            if (!row) return;

            setTimeout(() => {
                const element = this.dom.getElementById(row.id);
                element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            });
        });

        this.window.addEventListener('keyup', this.keyup);
        this.window.addEventListener('keydown', this.keydown);
    }

    public readonly document = input<AASDocument | null>(null);

    public readonly state = input<OnlineState>('offline');

    public readonly searchExpression = input<string>('');

    public readonly selected = output<aas.Referable[]>();

    public readonly onlineReady = computed(() => this.document()?.onlineReady ?? false);

    public readonly readonly = computed(() => this.document()?.readonly ?? true);

    public readonly modified = computed(() => this.document()?.modified ?? false);

    public readonly someSelected = computed(() => {
        const rows = this.store.state$().rows;
        return rows.length > 0 && rows.some(row => row.selected) && !rows.every(row => row.selected);
    });

    public readonly everySelected = computed(() => {
        const rows = this.store.state$().rows;
        return rows.length > 0 && rows.every(row => row.selected);
    });

    public readonly nodes = computed(() => this.store.state$().nodes);

    public readonly expanded = computed(() => this.store.state$().expanded);

    public readonly matchIndex = computed(() => this.store.state$().matchIndex);

    public readonly matchRow = computed(() => {
        const state = this.store.state$();
        return state.matchIndex >= 0 ? state.rows[state.matchIndex] : undefined;
    });

    public readonly message = computed(() => {
        const document = this.document();
        if (document) {
            if (document.content) {
                return '';
            }

            return stringFormat(
                this.translate.instant('INFO_AAS_OFFLINE'),
                new Date(document.timestamp).toLocaleString(this.translate.currentLang),
            );
        }

        return this.translate.instant('INFO_NO_SHELL_AVAILABLE');
    });

    public ngOnInit(): void {
        this.subscription.add(
            this.translate.onLangChange.subscribe(() => {
                this.updateRows(this.document());
            }),
        );
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.webSocketSubject?.unsubscribe();
        this.window.removeEventListener('keyup', this.keyup);
        this.window.removeEventListener('keydown', this.keydown);
    }

    public visualState(node: AASTreeNode): string {
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

    public expand(node?: AASTreeNode): void {
        if (node) {
            if (!node.expanded) {
                this.store.expandRow(node);
            }
        } else {
            this.store.expand();
            this.store.state$.update(state => ({ ...state, expanded: true }));
        }
    }

    public collapse(node?: AASTreeNode): void {
        if (node) {
            if (node.expanded) {
                this.store.collapseRow(node);
            }
        } else {
            this.store.collapse();
            this.store.state$.update(state => ({ ...state, expanded: false }));
        }
    }

    public toggleSelections(): void {
        this.store.toggleSelections();
    }

    public toggleSelection(node: AASTreeNode): void {
        this.store.toggleSelected(node, this.store.altKey, this.store.shiftKey);
    }

    public getReferenceUrl(reference: aas.Reference | string | undefined): string | undefined {
        if (!reference || this.state() === 'online') {
            return undefined;
        }

        if (typeof reference === 'string') {
            return `/aas?id=${encodeBase64Url(reference)}`;
        }

        if (reference.keys.length === 0) {
            return undefined;
        }

        if (reference.type === 'ExternalReference') {
            return `/aas?id=${encodeBase64Url(reference.keys[0].value)}`;
        }

        return undefined;
    }

    public getUrl(node: AASTreeNode): string | undefined {
        if (isFile(node.element)) {
            return this.getFileURL(node.element);
        }
        if (isBlob(node.element)) {
            return this.getBlobUrl(node.element);
        }

        if (isReferenceElement(node.element)) {
            return this.getReferenceUrl(node.element.value);
        }

        if (isOperation(node.element)) {
            return undefined; // this.openOperation(node.element);
        }

        return undefined;
    }

    public getRouterLink(node: AASTreeNode): unknown[] | undefined {
        const document = this.document();
        const identifiable = node.element;
        if (node === undefined || this.state() === 'online' || document === null) {
            return undefined;
        }

        let route: Route | undefined;
        if (isSubmodel(identifiable)) {
            route = findRouteForSubmodel(identifiable);
        } else if (isAssetAdministrationShell(identifiable)) {
            const tuple = findRouteForShell(document);
            route = tuple.route;
        }

        if (route === undefined) {
            return undefined;
        }

        return [
            `/views/${route.path}`,
            { endpoint: encodeBase64Url(document.endpoint), id: encodeBase64Url(document.id) },
        ];
    }

    public findNext(): void {
        this.searching.findNext();
    }

    public findPrevious(): void {
        this.searching.findPrevious();
    }

    public toString(value: aas.Reference | undefined): string {
        if (!value) {
            return '-';
        }

        return value.keys.map(key => key.value).join('.');
    }

    private updateRows(document: AASDocument | null): void {
        try {
            if (document) {
                const tree = AASTree.from(document, this.translate.currentLang);
                this.store.state$.update(state => ({
                    ...state,
                    matchIndex: -1,
                    rows: tree.nodes,
                    nodes: tree.expanded,
                }));
            } else {
                this.store.state$.update(state => ({
                    ...state,
                    matchIndex: -1,
                    rows: [],
                    nodes: [],
                }));
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    private getFileURL(file: aas.File): string | undefined {
        if (!file.value || this.state() === 'online') {
            return undefined;
        }

        const { url } = this.resolveFile(file);
        if (url === undefined) {
            return;
        }

        return url;
    }

    private getBlobUrl(blob: aas.Blob): string | undefined {
        const document = this.document();
        if (!document || !blob.parent || this.state() === 'online') {
            return undefined;
        }

        const smId = blob.parent.keys[0].value;
        const idShortPath = getIdShortPath(blob);
        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/submodels/${encodeBase64Url(smId)}/submodel-elements/${idShortPath}/value`;
    }

    private goOnline(): void {
        try {
            this.prepareOnline(this.store.rows.filter(row => row.selected));
            this.play();
        } catch {
            this.stop();
        }
    }

    private goOffline(): void {
        this.stop();
    }

    private play(): void {
        const document = this.document();
        if (document) {
            this.webSocketSubject = this.webSocketFactory.create();
            this.webSocketSubject.subscribe({
                next: this.onMessage,
                error: this.onError,
            });

            this.webSocketSubject.next(this.createMessage(document));
        }
    }

    private stop(): void {
        if (this.webSocketSubject) {
            this.webSocketSubject.unsubscribe();
            this.webSocketSubject = undefined;
        }
    }

    private prepareOnline(rows: AASTreeNode[]): void {
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

                    this.map.set(property.nodeId, row);
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
                const row = this.map.get(node.nodeId);
                if (row === undefined) {
                    continue;
                }

                row.value.set(
                    typeof node.value === 'boolean'
                        ? node.value
                        : convertToString(node.value, this.translate.currentLang),
                );
            }
        }
    };

    private onError = (error: unknown): void => {
        this.notify.log(LogType.Error, error);
    };

    private keyup = () => {
        this.store.shiftKey = false;
        this.store.altKey = false;
    };

    private keydown = (event: KeyboardEvent) => {
        this.store.shiftKey = event.shiftKey;
        this.store.altKey = event.altKey;
    };

    private resolveFile(file: aas.File): { url?: string; name?: string } {
        const value: { url?: string; name?: string } = {};
        const document = this.document();
        if (document?.content && file.value) {
            const submodel = selectSubmodel(document.content, file);
            if (submodel) {
                const smId = encodeBase64Url(submodel.id);
                const path = getIdShortPath(file);
                value.name = basename(file.value);
                const name = encodeBase64Url(document.endpoint);
                const id = encodeBase64Url(document.id);
                value.url = `/api/v1/endpoints/${name}/documents/${id}/submodels/${smId}/submodel-elements/${path}/value`;
            }
        }

        return value;
    }
}
