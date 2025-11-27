/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgClass, NgStyle } from '@angular/common';
import { Route, RouterLink } from '@angular/router';
import { WebSocketSubject } from 'rxjs/webSocket';
import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    computed,
    effect,
    input,
    output,
    DOCUMENT,
    untracked,
    inject,
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
    isFile,
    isBlob,
    isReferenceElement,
    isOperation,
    isSubmodel,
    isAssetAdministrationShell,
} from 'aas-core';

import { AASTree, AASTreeNode, getValue } from './aas-tree-node';
import { LiveState } from '../../types';
import { AASTreeSearch } from './aas-tree-search';
import { encodeBase64Url } from '../../utilities';
import { WebSocketFactoryService } from '../../services/web-socket-factory.service';
import { LogType, NotifyService } from '../notify/notify.service';
import { findRouteForShell, findRouteForSubmodel } from '../../utilities';

import { AASTreeApi } from './aas-tree-api';
import { WINDOW } from '../../services/window.service';
import { FormsModule } from '@angular/forms';
import { AASTreeState } from './aas-tree.state';
import { ChildComponent } from '../child-component';
import { VIEW_ROUTES } from '../../views/views-routes';

/**
 * Presents the contents of an Asset Administration Shell as a tree.
 */
@Component({
    selector: 'fhg-aas-tree',
    templateUrl: './aas-tree.component.html',
    styleUrls: ['./aas-tree.component.scss'],
    imports: [FormsModule, RouterLink, NgClass, NgStyle],
    providers: [AASTreeSearch, AASTreeApi, AASTreeState],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AASTreeComponent extends ChildComponent<AASTreeState> implements OnDestroy {
    private readonly liveNodes: LiveNode[] = [];
    private readonly map = new Map<string, AASTreeNode>();
    private readonly search = inject(AASTreeSearch);
    private readonly window = inject(WINDOW);
    private readonly dom = inject(DOCUMENT);
    private readonly notify = inject(NotifyService);
    private readonly viewRoutes = inject(VIEW_ROUTES);
    private readonly webSocketFactory = inject(WebSocketFactoryService);
    private shiftKey = false;
    private altKey = false;
    private webSocketSubject?: WebSocketSubject<WebSocketData>;

    public constructor() {
        super();

        effect(() => {
            this.search.start(untracked(this.state().contents), this.searchExpression());
        });

        effect(() => {
            const document = this.document();
            const value = untracked(this.state().document);
            if (value === null || document?.endpoint !== value.endpoint || document?.id !== value.id) {
                this.update(document);
            }
        });

        effect(() => {
            const currentLang = this.currentLang();
            untracked(this.state().contents).forEach(node => node.value.set(getValue(node.element, currentLang)));
        });

        effect(() => {
            if (this.live() === 'online') {
                this.goOnline();
            } else {
                this.goOffline();
            }
        });

        effect(() => {
            const contents = this.state().contents();
            this.selected.emit(contents.filter(node => node.selected).map(item => item.element));
        });

        effect(() => {
            const matchIndex = this.search.matchIndex();
            this.highlightNode(matchIndex);
        });

        effect(() => {
            const row = this.matchNode();
            if (!row) {
                return;
            }

            setTimeout(() => {
                const element = this.dom.getElementById(row.id);
                element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            });
        });

        this.window.addEventListener('keyup', this.keyup);
        this.window.addEventListener('keydown', this.keydown);
    }

    /** The state management service. */
    public override readonly state = input.required<AASTreeState>();

    /** The AAS document. */
    public readonly document = input<AASDocument | null>(null);

    /** The current live status. */
    public readonly live = input<LiveState>('offline');

    /** The current search expression. */
    public readonly searchExpression = input<string>('');

    /** The selected AAS structure elements. */
    public readonly selected = output<aas.Referable[]>();

    /** Indicates whether the current AAS can provide live data. */
    public readonly onlineReady = computed(() => this.document()?.onlineReady ?? false);

    /** Indicates whether the current AAS can be edited. */
    public readonly readonly = computed(() => this.document()?.readonly ?? true);

    /** Indicates whether the AAS is modified. */
    public readonly modified = computed(() => this.document()?.modified ?? false);

    /** Indicates whether at least one node is selected, but not all nodes. */
    public readonly someSelected = computed(() => {
        const contents = this.state().contents();
        return contents.length > 0 && contents.some(node => node.selected) && !contents.every(row => row.selected);
    });

    /** Indicates whether all nodes are selected. */
    public readonly everySelected = computed(() => {
        const contents = this.state().contents();
        return contents.length > 0 && contents.every(node => node.selected);
    });

    /** The visible nodes of the tree. */
    public readonly nodes = computed(() => this.state().nodes());

    /** Indicates whether the tree is fully expanded. */
    public readonly expanded = computed(() => this.state().expanded());

    /** The index of the current node that matches a search expression. */
    public readonly matchIndex = this.search.matchIndex;

    /** The current node that matches a search expression. */
    public readonly matchNode = computed(() => {
        const matchIndex = this.search.matchIndex();
        const contents = untracked(this.state().contents);
        return matchIndex >= 0 ? contents[matchIndex] : undefined;
    });

    public readonly message = computed(() => {
        const document = this.document();
        if (document) {
            if (document.content) {
                return '';
            }

            return this.translate.instant('Info.AAS_OFFLINE', {
                timestamp: new Date(document.timestamp).toLocaleString(untracked(this.currentLang)),
            });
        }

        return this.translate.instant('Info.NO_SHELL_AVAILABLE');
    });

    public ngOnDestroy(): void {
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
                this.expandNode(node);
            }
        } else {
            this.expandAll();
            this.state().update({ expanded: true });
        }
    }

    public collapse(node?: AASTreeNode): void {
        if (node) {
            if (node.expanded) {
                this.collapseRow(node);
            }
        } else {
            this.collapseAll();
            this.state().update({ expanded: false });
        }
    }

    public toggleSelections(): void {
        const tree = new AASTree(this.state().contents());
        tree.toggleSelections();
        this.state().update({
            contents: tree.contents,
            nodes: tree.nodes,
        });
    }

    public toggleSelection(node: AASTreeNode): void {
        const tree = new AASTree(this.state().contents());
        tree.toggleSelected(node, this.altKey, this.shiftKey);
        this.state().update({
            contents: tree.contents,
            nodes: tree.nodes,
        });
    }

    public getReferenceUrl(reference: aas.Reference | string | undefined): string | undefined {
        if (!reference || this.live() === 'online') {
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
        if (node === undefined || this.live() === 'online' || document === null) {
            return undefined;
        }

        let route: Route | undefined;
        if (isSubmodel(identifiable)) {
            route = findRouteForSubmodel(this.viewRoutes, identifiable);
        } else if (isAssetAdministrationShell(identifiable)) {
            const tuple = findRouteForShell(this.viewRoutes, document);
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
        this.search.findNext();
    }

    public findPrevious(): void {
        this.search.findPrevious();
    }

    private expandNode(node: AASTreeNode): void {
        const tree = new AASTree(untracked(this.state().contents));
        tree.expand(node);
        this.state().update({
            contents: tree.contents,
            nodes: tree.nodes,
        });
    }

    private highlightNode(matchIndex: number): void {
        const tree = new AASTree(untracked(this.state().contents));
        if (matchIndex >= 0) {
            tree.expand(matchIndex);
        }

        tree.highlight(matchIndex);
        this.state().update({
            contents: tree.contents,
            nodes: tree.nodes,
            matchIndex,
        });
    }

    private collapseRow(row: AASTreeNode): void {
        const tree = new AASTree(untracked(this.state().contents));
        tree.collapse(row);
        this.state().update({
            contents: tree.contents,
            nodes: tree.nodes,
        });
    }

    private collapseAll(): void {
        const tree = new AASTree(untracked(this.state().contents));
        tree.collapse();
        this.state().update({
            contents: tree.contents,
            nodes: tree.nodes,
        });
    }

    private expandAll(): void {
        const tree = new AASTree(untracked(this.state().contents));
        tree.expand();
        this.state().update({
            contents: tree.contents,
            nodes: tree.nodes,
        });
    }

    private update(document: AASDocument | null): void {
        if (document) {
            const tree = AASTree.from(this.viewRoutes, document, untracked(this.currentLang));
            this.state().update({
                document,
                matchIndex: -1,
                contents: tree.contents,
                nodes: tree.nodes,
            });
        } else {
            this.state().update({
                document: null,
                matchIndex: -1,
                contents: [],
                nodes: [],
            });
        }
    }

    private getFileURL(file: aas.File): string | undefined {
        if (this.live() === 'online') {
            return undefined;
        }

        const document = this.document();
        if (!document?.content || !file.value) {
            return undefined;
        }

        const submodel = selectSubmodel(document.content, file);
        if (!submodel) {
            return undefined;
        }

        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(file);
        const name = encodeBase64Url(document.endpoint);
        const id = encodeBase64Url(document.id);
        return `/api/v1/endpoints/${name}/documents/${id}/submodels/${smId}/submodel-elements/${path}/value`;
    }

    private getBlobUrl(blob: aas.Blob): string | undefined {
        const document = this.document();
        if (!document || !blob.parent || this.live() === 'online') {
            return undefined;
        }

        const smId = blob.parent.keys[0].value;
        const idShortPath = getIdShortPath(blob);
        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/submodels/${encodeBase64Url(smId)}/submodel-elements/${idShortPath}/value`;
    }

    private goOnline(): void {
        try {
            this.prepareOnline(
                this.state()
                    .contents()
                    .filter(node => node.selected),
            );
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
        if (data.type !== 'LiveNode[]') {
            return;
        }

        const currentLang = untracked(this.currentLang);
        for (const liveNode of data.data as LiveNode[]) {
            const node = this.map.get(liveNode.nodeId);
            if (node === undefined) {
                continue;
            }

            node.value.set(
                typeof liveNode.value === 'boolean' ? liveNode.value : convertToString(liveNode.value, currentLang),
            );
        }
    };

    private onError = (error: unknown): void => {
        this.notify.log(LogType.Error, error);
    };

    private keyup = (): void => {
        this.shiftKey = false;
        this.altKey = false;
    };

    private keydown = (event: KeyboardEvent): void => {
        this.shiftKey = event.shiftKey;
        this.altKey = event.altKey;
    };
}
