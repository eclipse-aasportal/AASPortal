/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { FormsModule } from '@angular/forms';
import { Route, RouterLinkWithHref } from '@angular/router';
import { Component, effect, inject, input, model, output, signal, untracked, WritableSignal } from '@angular/core';

import {
    aas,
    AASDocument,
    convertToString,
    extensionToMimeType,
    getAbbreviation,
    getChildren,
    getLocaleValue,
    getSemanticId,
    isAnnotatedRelationshipElement,
    isAssetAdministrationShell,
    isBlob,
    isEntity,
    isFile,
    isMultiLanguageProperty,
    isOperation,
    isProperty,
    isRange,
    isReferenceElement,
    isSubmodel,
    isSubmodelElementCollection,
    isSubmodelElementList,
    LiveNode,
    LiveRequest,
    noop,
    normalize,
    toDisplayValue,
    WebSocketData,
} from 'aas-core';

import { AASTreeSearch } from './aas-tree-search';
import { AASTreeApi } from './aas-tree-api';
import { LiveState } from '../../types';
import { basename, encodeBase64Url, findRouteForShell, findRouteForSubmodel } from '../../utilities';
import { VIEW_ROUTES } from '../../views/views-routes';
import { WebSocketService } from '../../shared/services/web-socket.service';
import { NotifyService } from '../../core/notify/notify.service';
import { MaxLengthPipe } from '../../shared/pipes/max-length.pipe';
import {
    Tree,
    TreeComponent,
    TreeData,
    TreeNode,
    TreeResult,
    TreeSymbolType,
    TreeType,
    TreeValueType,
} from '../tree/tree.component';
import { Subscription } from 'rxjs';

export type AASNodeOptions = {
    index: number;
};

export type AASNode = TreeNode<aas.Referable, AASNodeOptions>;

export type AASTree = Tree<aas.Referable, AASNodeOptions>;

export type AASTreeResult = TreeResult<aas.Referable, AASNodeOptions>;

export type AASTreeData = {
    document: AASDocument | null;
} & TreeData<aas.Referable, AASNodeOptions>;

const initialState: AASTreeData = {
    document: null,
    matchIndex: -1,
    selectionDisabled: false,
    tree: [],
};

/**
 * Presents the contents of an Asset Administration Shell as a tree.
 */
@Component({
    selector: 'fhg-aas-tree',
    imports: [FormsModule, RouterLinkWithHref, MaxLengthPipe],
    templateUrl: '../tree/tree.component.html',
    styleUrl: '../tree/tree.component.scss',
    providers: [AASTreeSearch, AASTreeApi],
})
export class AASTreeComponent extends TreeComponent<aas.Referable, AASNodeOptions> {
    private readonly search = inject(AASTreeSearch);
    private readonly viewRoutes = inject(VIEW_ROUTES);
    private readonly notify = inject(NotifyService);
    private readonly document$ = signal(initialState.document);
    private readonly webSocket = inject(WebSocketService);
    private readonly map = new Map<string, TreeNode>();
    private readonly liveNodes: LiveNode[] = [];
    private webSocketSubscription?: Subscription;

    public constructor() {
        super();

        effect(() => {
            const document = this.document();
            const env = document?.content;
            const shell = env?.assetAdministrationShells.at(0);
            if (!document || !env || !shell) {
                this.update({ tree: [], document: null });
                return;
            }

            const tree = this.createTree(env, shell);
            this.update({ tree });
        });

        effect(() => {
            const matchIndex = this.search.matchIndex();
            if (!untracked(this.selectionDisabled)) {
                this.update({ matchIndex });
            }
        });

        effect(() => {
            if (this.live() === 'online') {
                this.goLive();
            } else {
                this.endLive();
            }
        });

        effect(() => {
            this.selectedElements.emit(this.selectedNodes().map(node => node.id));
        });
    }

    /**
     * The current AAS document.
     */
    public readonly document = input<AASDocument | null>(null);

    /**
     * The current live status.
     */
    public readonly live = model<LiveState>('offline');

    /**
     * The currently selected elements in the tree. This is used to synchronize the selection with other components, e.g., the value view.
     */
    public readonly selectedElements = output<aas.Referable[]>();

    /**
     * Finds and navigates to the next search result in the tree.
     * Delegates to the underlying search service to advance to the next match.
     */
    public findNext(): void {
        this.search.findNext();
    }

    /**
     * Finds the previous search result in the tree.
     * Delegates to the underlying search service to navigate to the previous matching item.
     */
    public findPrevious(): void {
        this.search.findPrevious();
    }

    public override ngOnDestroy(): void {
        this.webSocketSubscription?.unsubscribe();
        super.ngOnDestroy();
    }

    public override getUrl(node: AASNode): string | undefined {
        if (isFile(node.id)) {
            return this.getFileURL(node.id);
        }

        if (isBlob(node.id)) {
            return this.getBlobUrl(node.id);
        }

        if (isReferenceElement(node.id)) {
            return this.getReferenceUrl(node.id.value);
        }

        return undefined;
    }

    public override getRouterLink(node: TreeNode): unknown[] | undefined {
        const document = this.document();
        const identifiable = node.id;
        if (node === undefined || document === null) {
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

    protected override start(nodes: AASNode[], searchExpression: string | undefined): void {
        this.search.start(nodes, searchExpression);
    }

    protected override loadChildren(node: AASNode): AASTreeResult | undefined {
        const parent = node.id;
        const children: AASNode[] = [];
        const level = node.level + 1;
        if (isAssetAdministrationShell(parent)) {
            const env = untracked(this.document)?.content;
            if (!env) {
                return undefined;
            }

            let index = 0;
            for (const child of getChildren(parent, env)) {
                children.push(this.createNode(child, parent, level, index++, node.path));
            }
        } else {
            let index = 0;
            for (const child of getChildren(parent)) {
                children.push(this.createNode(child, parent, level, index++, node.path));
            }
        }

        return { parent: node, children };
    }

    protected override loaded(node: AASNode): void {
        noop(node);
    }

    protected override update(newState: Partial<AASTreeData>): void {
        super.update(newState);

        if (newState.document !== undefined) {
            this.document$.set(newState.document);
        }
    }

    private createTree(env: aas.Environment, shell: aas.AssetAdministrationShell): AASTree {
        return [this.createNode(shell, null, 0, 0, '')];
    }

    private createNode(
        referable: aas.Referable,
        parent: aas.Referable | null,
        level: number,
        index: number,
        path: string,
    ): AASNode {
        if (this.isLeaf(referable)) {
            return this.createLeaf(referable, parent, level, index, path);
        }

        return this.createComposite(referable, parent, level, index, path);
    }

    private createLeaf(
        referable: aas.Referable,
        parent: aas.Referable | null,
        level: number,
        index: number,
        path: string,
    ): AASNode {
        const { value, valueType } = this.getValue(referable);
        const idShort = referable.idShort ?? index.toString();
        return {
            id: referable,
            parentId: parent,
            name: this.createName(parent, referable, index),
            suffix: this.getSuffix(referable),
            path: path ? `${path}.${idShort}` : idShort,
            symbolType: 'text',
            symbol: getAbbreviation(referable.modelType),
            type: 'text',
            level,
            isLeaf: true,
            selected: false,
            highlighted: false,
            value,
            valueType,
            options: { index },
        };
    }

    private createComposite(
        referable: aas.Referable,
        parent: aas.Referable | null,
        level: number,
        index: number,
        path: string,
    ): AASNode {
        let hasChildren: boolean;
        let symbolType: TreeSymbolType;
        let symbol: string | undefined;
        const idShort = referable.idShort ?? index.toString();
        if (isAssetAdministrationShell(referable)) {
            hasChildren = referable.submodels !== undefined && referable.submodels.length > 0;
            symbolType = 'image';
            symbol = untracked(this.document)?.thumbnail ?? 'assets/resources/aas-idta.png';
        } else {
            hasChildren = getChildren(referable).length > 0;
            symbolType = 'text';
            symbol = getAbbreviation(referable.modelType);
        }

        return {
            id: referable,
            parentId: parent,
            name: this.createName(parent, referable, index),
            suffix: this.getSuffix(referable),
            path: path ? `${path}.${idShort}` : idShort,
            symbolType,
            symbol,
            type: this.determineType(referable),
            level,
            isLeaf: false,
            expanded: false,
            selected: false,
            highlighted: false,
            hasChildren,
            loaded: false,
            options: { index },
        };
    }

    private createName(parent: aas.Referable | null, referable: aas.Referable, index: number): string {
        if (parent?.modelType === 'SubmodelElementList') {
            return referable.idShort ? `[${index} : ${referable.idShort}]` : `[${index}]`;
        }

        return referable.idShort;
    }

    private determineType(referable: aas.Referable): TreeType {
        if (isSubmodel(referable)) {
            if (findRouteForSubmodel(this.viewRoutes, referable, false)) {
                return 'routerLink';
            }
        }

        if (isAssetAdministrationShell(referable)) {
            const document = untracked(this.document);
            if (document) {
                if (findRouteForShell(this.viewRoutes, document, false)) {
                    return 'routerLink';
                }
            }
        }

        return 'text';
    }

    private isLeaf(referable: aas.Referable): boolean {
        switch (referable.modelType) {
            case 'AssetAdministrationShell':
            case 'Submodel':
            case 'SubmodelElementCollection':
            case 'SubmodelElementList':
            case 'AnnotatedRelationshipElement':
            case 'Entity':
            case 'Operation':
                return false;
            default:
                return true;
        }
    }

    private getSuffix(referable: aas.Referable | null): string {
        let suffix: string | undefined;
        if (!referable) {
            suffix = '';
        } else if (isAssetAdministrationShell(referable)) {
            suffix = referable.id;
        } else if (isMultiLanguageProperty(referable)) {
            if (referable && Array.isArray(referable.value)) {
                suffix = `${referable.value.map(item => item.language).join(', ')}`;
            }
        } else if (isSubmodel(referable)) {
            const sid = getSemanticId(referable);
            suffix = sid ? `sematicId: ${sid}` : `id: ${referable.id}`;
        } else if (isProperty(referable)) {
            const valueType = (referable as aas.Property).valueType;
            if (valueType) {
                suffix = valueType.startsWith('xs:') ? valueType.substring(3) : valueType;
            }
        } else if (isBlob(referable)) {
            suffix = referable.contentType;
        } else if (isFile(referable)) {
            if (referable.contentType) {
                suffix = referable.contentType;
            } else if (referable.value) {
                suffix = extensionToMimeType(referable.value);
            }
        } else if (isRange(referable)) {
            const valueType = (referable as aas.Property).valueType;
            if (valueType) {
                suffix = valueType.startsWith('xs:') ? valueType.substring(3) : valueType;
            }
        } else if (isSubmodelElementCollection(referable)) {
            suffix = referable.value ? `${referable.value.length}` : '0';
        } else if (isSubmodelElementList(referable)) {
            suffix = referable.value ? `${referable.value.length}` : '0';
        } else if (isAnnotatedRelationshipElement(referable)) {
            suffix = referable.annotations ? `${referable.annotations.length}` : '0';
        } else if (isEntity(referable)) {
            suffix = referable.statements ? `${referable.statements.length}` : '0';
        } else if (isOperation(referable)) {
            suffix = (
                (referable.inputVariables?.length ?? 0) +
                (referable.inoutputVariables?.length ?? 0) +
                (referable.outputVariables?.length ?? 0)
            ).toString();
        }

        return suffix ? '[' + suffix + ']' : '';
    }

    private getFileURL(file: aas.File): string | undefined {
        if (this.live() === 'online') {
            return undefined;
        }

        const document = this.document();
        if (!document?.content || !file.value || !file.path) {
            return undefined;
        }

        const smId = encodeBase64Url(file.path.id);
        const path = file.path.idShortPath;
        const name = encodeBase64Url(document.endpoint);
        const id = encodeBase64Url(document.id);
        return `/api/v1/endpoints/${name}/documents/${id}/submodels/${smId}/submodel-elements/${path}/value`;
    }

    private getBlobUrl(blob: aas.Blob): string | undefined {
        const document = this.document();
        if (!document || !blob.path || this.live() === 'online') {
            return undefined;
        }

        const smId = encodeBase64Url(blob.path.id);
        const idShortPath = blob.path.idShortPath;
        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/submodels/${smId}/submodel-elements/${idShortPath}/value`;
    }

    private getReferenceUrl(reference: aas.Reference | undefined): string | undefined {
        if (!reference || this.live() === 'online') {
            return undefined;
        }

        if (reference.keys.length === 0) {
            return undefined;
        }

        if (reference.type === 'ExternalReference') {
            return `/aas?id=${encodeBase64Url(reference.keys[0].value)}`;
        }

        return undefined;
    }

    private getValue(referable: aas.Referable | null): {
        value?: string | undefined;
        valueType?: TreeValueType;
    } {
        if (!referable) {
            return {};
        }

        if (isBlob(referable)) {
            return referable.value
                ? { value: `${referable.value.length}`, valueType: 'url' }
                : { value: '-', valueType: 'text' };
        }

        if (isFile(referable)) {
            return referable.value
                ? { value: basename(normalize(referable.value)), valueType: 'url' }
                : { value: '-', valueType: 'text' };
        }

        if (isMultiLanguageProperty(referable)) {
            return {
                value: getLocaleValue(referable.value, this.currentLang()) ?? '-',
                valueType: 'text',
            };
        }

        if (isProperty(referable)) {
            return { value: this.getPropertyValue(referable), valueType: 'text' };
        }

        if (isRange(referable)) {
            return {
                value: `${convertToString(referable.min, this.currentLang())} ... ${convertToString(referable.max, this.currentLang())}`,
                valueType: 'text',
            };
        }

        if (isReferenceElement(referable)) {
            return { value: this.referenceToString(referable.value), valueType: 'text' };
        }

        return {};
    }

    private getPropertyValue(property: aas.Property): string | undefined {
        return toDisplayValue(property.value, property.valueType, this.currentLang());
    }

    private referenceToString(reference: aas.Reference | undefined): string {
        return reference?.keys.map(key => key.value).join('.') ?? '-';
    }

    private goLive(): void {
        try {
            this.liveNodes.splice(0, this.liveNodes.length);
            this.map.clear();
            const tree: AASTree = untracked(this.tree).map(node => {
                if (node.selected && isProperty(node.id)) {
                    const property = node.id;
                    if (property.nodeId) {
                        this.liveNodes.push({
                            nodeId: property.nodeId,
                            valueType: property.valueType ?? 'undefined',
                        });

                        node = { ...node, value: signal(property.value), valueType: 'signal' };
                        this.map.set(property.nodeId, node);
                    }
                }

                return node;
            });

            this.update({ tree, selectionDisabled: true });

            const document = this.document();
            if (document) {
                this.webSocketSubscription = this.webSocket.getMessages().subscribe({
                    next: this.onMessage,
                    error: this.onError,
                });

                this.webSocket.sendMessage(this.createMessage(document));
            }
        } catch {
            this.live.set('offline');
            this.endLive();
        }
    }

    private endLive(): void {
        const nodes = new Set(this.map.values());
        const tree = untracked(this.tree).map(node => {
            if (nodes.has(node)) {
                const { value, valueType } = this.getValue(node.id);
                return { ...node, value, valueType };
            }

            return node;
        });

        this.update({ tree, selectionDisabled: false });
        this.map.clear();
        this.liveNodes.splice(0, this.liveNodes.length);

        if (this.webSocketSubscription) {
            this.webSocketSubscription.unsubscribe();
            this.webSocketSubscription = undefined;
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
            if (node === undefined || node.valueType !== 'signal' || !node.value) {
                continue;
            }

            (node.value as WritableSignal<string>).set(convertToString(liveNode.value, currentLang));
        }
    };

    private onError = (error: unknown): void => {
        this.notify.error(error);
    };
}
