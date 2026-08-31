/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { catchError, concatMap, finalize, map, of, Subject } from 'rxjs';

import {
    aas,
    AASDocument,
    getAbbreviation,
    getChildren,
    getReferenced,
    getSemanticId,
    isEntity,
    isProperty,
    isRelationshipElement,
    noop,
} from 'aas-core';

import { EndpointsApi } from '../../shared/services/endpoints-api';
import { encodeBase64Url, findRouteForShell, findSubmodel, getDisplayName } from '../../utilities';
import { HIERARCHICAL_STRUCTURES_1_0, HIERARCHICAL_STRUCTURES_1_1 } from '../views-constants';
import { VIEW_ROUTES } from '../views-routes';
import { Tree, TreeComponent, TreeNode, TreeResult } from '../../components/tree/tree.component';
import { Router, RouterLinkWithHref } from '@angular/router';
import * as d3 from 'd3-hierarchy';

export type ArcheType = 'Full' | 'OneDown' | 'OneUp';

export type NodeOptions = {
    archeType: ArcheType;
    document?: AASDocument | null;
    parentPath?: string;
};

export type HierarchicalTreeResult = TreeResult<aas.Entity, NodeOptions>;

export type HierarchicalNode = TreeNode<aas.Entity, NodeOptions>;

const ARCHE_TYPE = 'https://admin-shell.io/idta/HierarchicalStructures/ArcheType/1/0';
const ENTRY_NODE = 'https://admin-shell.io/idta/HierarchicalStructures/EntryNode/1/0';
const NODE = 'https://admin-shell.io/idta/HierarchicalStructures/Node/1/0';
const SAME_AS = 'https://admin-shell.io/idta/HierarchicalStructures/SameAs/1/0';
const IS_PART_OF = 'https://admin-shell.io/idta/HierarchicalStructures/IsPartOf/1/0';
const HAS_PART = 'https://admin-shell.io/idta/HierarchicalStructures/HasPart/1/0';

/**
 * Provides a view for hierarchical structures of Asset Administration Shells represented as a tree.
 */
@Component({
    selector: 'fhg-hierarchical-structure',
    templateUrl: './hierarchical-structure.html',
    styleUrl: './hierarchical-structure.scss',
    imports: [FormsModule, RouterLinkWithHref],
})
export class HierarchicalStructure extends TreeComponent<aas.Entity, NodeOptions> {
    private readonly api = inject(EndpointsApi);
    private readonly viewRoutes = inject(VIEW_ROUTES);
    private readonly router = inject(Router);
    private readonly subject = new Subject<HierarchicalNode>();
    private readonly visited = new Set<string>();
    private readonly pending = signal(0);
    private readonly vbWidth = 1200;
    private readonly vbHeight = 500;

    public constructor() {
        super();

        effect(() => {
            this.currentLang();
            const submodel = this.submodel();
            if (!submodel) {
                return;
            }

            const archeType = this.getArcheType(submodel);
            const entryNode = this.getEntryNode(submodel);
            if (!entryNode || !archeType || untracked(this.tree).at(0)?.id === entryNode) {
                return;
            }

            this.visited.clear();
            const tree = this.createTree(archeType, entryNode);
            this.update({ tree });
            tree.forEach(item => this.loaded(item));

            if (this.layout()) {
                untracked(() => {
                    const root = this.layout();
                    if (root) {
                        const widest = Math.max(...root.descendants().map(n => n.children?.length ?? 0));
                        this.horizontal.set(widest > 4); // switch to a left-to-right layout once any level gets this wide
                    }
                    this.fit();
                });
            }
        });

        this.subject
            .pipe(
                takeUntilDestroyed(),
                concatMap(item => {
                    const globalAssetId = item.id.globalAssetId;
                    if (!globalAssetId || item.options.document) {
                        return of();
                    }

                    return this.api.getDocument('Asset', globalAssetId).pipe(
                        catchError(() => of(null)),
                        map(document => ({ document, item })),
                        finalize(() => this.pending.update(n => n - 1)),
                    );
                }),
            )
            .subscribe(({ document, item }) => {
                const tree = this.tree().map(obj =>
                    document && obj.path === item.path ? this.updateNode(obj, document) : obj,
                );
                this.update({ tree });
            });
    }

    /**
     * The current AAS environment.
     */
    private readonly env = computed(
        () =>
            this.document()?.content ??
            ({
                assetAdministrationShells: [],
                conceptDescriptions: [],
                submodels: [],
            } satisfies aas.Environment),
    );

    /**
     * The current active AASDocument.
     */
    public readonly document = input<AASDocument>();

    /**
     * The current active submodel that represents the hierarchical structure.
     */
    public readonly submodel = input<aas.Submodel>();

    /**
     * Whether the tree is laid out left-to-right instead of top-to-bottom. Set automatically
     * (see the constructor) once a node turns out to have more than 4 children, so a wide tree
     * doesn't overflow the viewport horizontally.
     */
    public readonly horizontal = signal(false);

    /**
     * Generates a route link to a specific view for the specified node.
     *
     * @param node - The tree node containing a document for which to generate the route link.
     * @returns An array representing the route link, including the route path and encoded document properties,
     *          or `undefined` if no valid document or route is found.
     */
    public override getRouterLink(node: HierarchicalNode): unknown[] | undefined {
        const document = node.options.document ?? (node.level === 0 ? this.document() : undefined);
        if (!document) {
            return undefined;
        }

        const tuple = findRouteForShell(this.viewRoutes, document);
        const route = tuple.route;
        if (route === undefined) {
            return undefined;
        }

        return [
            `/views/${route.path}`,
            { endpoint: encodeBase64Url(document.endpoint), id: encodeBase64Url(document.id) },
        ];
    }

    /**
     * Load the children for a given tree node according to its hierarchical archetype.
     *
     * @param parent The parent element for which the child elements are to be loaded.
     */
    protected override loadChildren(parent: HierarchicalNode): HierarchicalTreeResult | undefined {
        const children: HierarchicalNode[] = [];
        const parentArcheType = parent.options.archeType;
        if (parentArcheType === 'Full') {
            this.createChildren(parent, children);
        } else if (parentArcheType === 'OneDown') {
            const env = parent.options.document?.content;
            if (env) {
                const submodel = this.findHierarchicalStructure(env);
                if (!submodel) {
                    return undefined;
                }

                const archeType = this.getArcheType(submodel);
                const entryNode = this.getEntryNode(submodel);
                if (!entryNode) {
                    return undefined;
                }

                parent = {
                    ...parent,
                    id: entryNode,
                    name: entryNode.idShort,
                    options: { ...parent.options },
                };

                if (archeType === 'Full' || archeType === 'OneDown') {
                    this.createChildren(parent, children);
                }
            }
        }

        return { parent, children };
    }

    /**
     * Loads the Asset Administration Shell that corresponds to the globalAssetId of the specified node.
     *
     * @param item The loaded node.
     */
    protected loaded(item: HierarchicalNode): void {
        if (item.id.globalAssetId && !item.options.document) {
            this.pending.update(n => n + 1);
        }

        this.subject.next(item);
    }

    /** Whether any shell lookups triggered by {@link loaded} are still in flight. */
    public readonly loading = computed(() => this.pending() > 0);

    /**
     * Not relevant.
     */
    protected override start(nodes: HierarchicalNode[], searchExpression: string | undefined): void {
        noop(nodes, searchExpression);
    }

    /**
     * Navigates to the route for the specified node's AAS document, if one is available
     * (double-click handler in the tree view).
     *
     * @param node The tree node to navigate to.
     */
    public openNode(node: HierarchicalNode): void {
        const link = this.getRouterLink(node);
        if (link) {
            this.router.navigate(link);
        }
    }

    /**
     * Wraps a node's name onto at most two lines for display inside the fixed-size SVG node box,
     * breaking at the nearest word boundary when possible instead of mid-word. If the second
     * line would still be too long, it's truncated with `…`.
     * @param name The full node name.
     * @param maxChars The maximum character length of each line.
     * @returns A tuple of `[firstLine]` if the name fits on one line, or `[firstLine, secondLine]`.
     */
    public wrap(name: string, maxChars = 22): [string, string?] {
        if (name.length <= maxChars) {
            return [name];
        }

        const cut = name.lastIndexOf(' ', maxChars);
        const at = cut > maxChars / 2 ? cut : maxChars;
        const second = name.slice(at).trim();
        return [name.slice(0, at).trim(), second.length > maxChars ? second.slice(0, maxChars - 1) + '…' : second];
    }

    private updateNode(item: HierarchicalNode, document: AASDocument | null): HierarchicalNode {
        const shell = document?.content?.assetAdministrationShells?.at(0);
        if (!shell) {
            return { ...item, options: { ...item.options, document } } satisfies HierarchicalNode;
        }

        const update: HierarchicalNode = {
            ...item,
            symbolType: 'image',
            symbol: document?.thumbnail ?? undefined,
            type: 'routerLink',
            name: getDisplayName(shell, document?.content, this.currentLang()),
            suffix: `[${document?.id}]`,
            options: { ...item.options, document },
        };

        const node = item.id;
        const archeType = item.options.archeType;
        if (archeType === 'OneDown') {
            if (!this.isNode(node)) {
                return update;
            }

            const submodel = findSubmodel(document!, [HIERARCHICAL_STRUCTURES_1_0, HIERARCHICAL_STRUCTURES_1_1]);
            if (!submodel) {
                return update;
            }

            const entryNode = this.getEntryNode(submodel);
            if (!entryNode) {
                return update;
            }

            const archeType = this.getArcheType(submodel);
            if (archeType === 'Full' || archeType === 'OneDown') {
                update.isLeaf = false;
                if (!update.isLeaf) {
                    update.hasChildren =
                        entryNode.statements !== undefined &&
                        entryNode.statements.some(statement => isEntity(statement) && this.isNode(statement));
                }
            }
        }

        return update;
    }

    /** The current tree, laid out via d3-hierarchy, or `null` while the tree is empty. */
    public readonly layout = computed(() => {
        const nodes = this.tree();
        if (nodes.length === 0) {
            return null;
        }

        const stratify = d3
            .stratify<HierarchicalNode>()
            .id(n => n.path)
            .parentId(n => n.options.parentPath);

        const size: [number, number] = this.horizontal()
            ? [80, 340] // [vertical gap between siblings, horizontal gap between levels]
            : [200, 120]; // [horizontal gap between siblings, vertical gap between levels]

        const treeLayout = d3.tree<HierarchicalNode>().nodeSize(size);
        return treeLayout(stratify(nodes));
    });

    /**
     * The screen x-coordinate of the specified laid-out node — d3's `x`/`y` axes are swapped
     * when {@link horizontal} is on, so this (and {@link ny}) is what the template should use
     * instead of `node.x`/`node.y` directly.
     * @param n The laid-out node.
     */
    public nx(n: d3.HierarchyPointNode<HierarchicalNode>): number {
        return this.horizontal() ? n.y : n.x;
    }

    /**
     * The screen y-coordinate of the specified laid-out node. See {@link nx}.
     * @param n The laid-out node.
     */
    public ny(n: d3.HierarchyPointNode<HierarchicalNode>): number {
        return this.horizontal() ? n.x : n.y;
    }

    /** The currently selected node, shown in the detail panel, if any. */
    public readonly selectedNode = computed(() => this.tree().find(n => n.selected));

    /**
     * Determines whether the specified node's AAS document is resolved and has a route it can
     * be opened in.
     * @param node The tree node to check.
     */
    public isNavigable(node: HierarchicalNode): boolean {
        return this.getRouterLink(node) !== undefined;
    }

    /**
     * Determines whether the specified node has unloaded children, i.e. still needs an
     * "expand" affordance in the tree view.
     * @param node The tree node to check.
     */
    public canExpand(node: HierarchicalNode): boolean {
        return 'hasChildren' in node && node.hasChildren === true && !node.loaded;
    }

    /**
     * Copies the specified text (e.g. a node's asset ID) to the clipboard.
     * @param text The text to copy, if any.
     */
    public copy(text: string | undefined): void {
        if (text) {
            navigator.clipboard.writeText(text);
        }
    }

    //
    // Pan & zoom (SVG viewport, drag-to-pan, wheel-to-zoom, and fit-to-content)
    //

    /** The current zoom factor of the SVG viewport. */
    public readonly zoom = signal(1);

    /** The current horizontal pan offset of the SVG viewport, in viewport units. */
    public readonly panX = signal(0);

    /** The current vertical pan offset of the SVG viewport, in viewport units. */
    public readonly panY = signal(0);

    /** Whether the user is currently dragging (panning) the SVG viewport. */
    public readonly dragging = signal(false);

    private last = { x: 0, y: 0 };

    /** The SVG `transform` attribute value combining the current pan and zoom. */
    public readonly transform = computed(() => `translate(${this.panX()},${this.panY()}) scale(${this.zoom()})`);

    /** The SVG `viewBox` attribute value. Fixed size — the content is scaled via {@link transform} instead. */
    public readonly viewBox = computed(() => `0 0 ${this.vbWidth} ${this.vbHeight}`);

    /**
     * Mouse wheel handler: zooms in/out around the current pan position.
     * @param e The wheel event.
     */
    public onWheel(e: WheelEvent): void {
        e.preventDefault();
        this.zoomBy(e.deltaY < 0 ? 1.1 : 0.9);
    }

    /**
     * Multiplies the current zoom factor by the specified amount, clamped to [0.25, 2.5].
     * @param factor The zoom multiplier, e.g. `1.1` to zoom in, `0.9` to zoom out.
     */
    public zoomBy(factor: number): void {
        this.zoom.update(z => Math.min(5, Math.max(0.25, z * factor)));
    }

    /**
     * Mouse-down handler: starts a pan-drag gesture.
     * @param e The mouse event.
     */
    public onDown(e: MouseEvent): void {
        this.dragging.set(true);
        this.last = { x: e.clientX, y: e.clientY };
    }

    /**
     * Mouse-move handler: while dragging, pans the viewport by the pointer's movement delta.
     * @param e The mouse event.
     */
    public onMove(e: MouseEvent): void {
        if (!this.dragging()) {
            return;
        }

        this.panX.update(x => x + (e.clientX - this.last.x));
        this.panY.update(y => y + (e.clientY - this.last.y));
        this.last = { x: e.clientX, y: e.clientY };
    }

    /**
     * Mouse-up (or mouse-leave) handler: ends the current pan-drag gesture.
     */
    public onUp(): void {
        this.dragging.set(false);
    }

    /** The pinch distance at the start of the current two-finger touch gesture, or `0` if none is active. */
    private pinchStart = 0;

    /**
     * Touch-start handler: begins a one-finger pan drag, or primes a two-finger pinch-to-zoom.
     * @param e The touch event.
     */
    public onTouchStart(e: TouchEvent): void {
        if (e.touches.length === 1) {
            this.dragging.set(true);
            this.last = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2) {
            this.dragging.set(false);
            this.pinchStart = this.touchDistance(e);
        }
    }

    /**
     * Touch-move handler: continues a one-finger pan drag, or applies pinch-to-zoom based on
     * the change in distance between two fingers.
     * @param e The touch event.
     */
    public onTouchMove(e: TouchEvent): void {
        e.preventDefault();

        if (e.touches.length === 1 && this.dragging()) {
            const t = e.touches[0];
            this.panX.update(x => x + (t.clientX - this.last.x));
            this.panY.update(y => y + (t.clientY - this.last.y));
            this.last = { x: t.clientX, y: t.clientY };
        } else if (e.touches.length === 2 && this.pinchStart > 0) {
            const distance = this.touchDistance(e);
            this.zoomBy(distance / this.pinchStart);
            this.pinchStart = distance;
        }
    }

    /**
     * Touch-end (or touch-cancel) handler: ends the current pan drag or pinch-zoom gesture.
     */
    public onTouchEnd(): void {
        this.dragging.set(false);
        this.pinchStart = 0;
    }

    /**
     * The on-screen distance between the first two touch points of a touch event, used for
     * pinch-to-zoom.
     * @param e The touch event. Must have at least two touch points.
     */
    private touchDistance(e: TouchEvent): number {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.hypot(dx, dy);
    }

    public toggleOrientation(): void {
        this.horizontal.set(!this.horizontal);
    }

    /**
     * Adjusts pan and zoom so that the whole current tree layout fits within the SVG viewport.
     */
    public fit(): void {
        const nodes = this.layout()?.descendants() ?? [];
        if (nodes.length === 0) {
            return;
        }

        const xs = nodes.map(n => this.nx(n));
        const ys = nodes.map(n => this.ny(n));
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const halfW = 130; // half node width
        const halfH = 28; // half node height
        const width = maxX - minX + 220; // + node box width
        const height = maxY - minY + 140; // + node box height and padding

        const z = Math.min(1.6, this.vbWidth / width, this.vbHeight / height);
        this.zoom.set(z);
        if (this.horizontal()) {
            this.panX.set(60 - (minX - halfW) * z); // left-aligned
            this.panY.set(this.vbHeight / 2 - ((minY + maxY) / 2) * z); // vertically centred
        } else {
            this.panX.set(this.vbWidth / 2 - ((minX + maxX) / 2) * z); // horizontally centred
            this.panY.set(50 - (minY - halfH) * z); // top-aligned
        }
    }

    /**
     * Selects the specified node, shown in the detail panel (deselects any other selection).
     * @param node The node to select.
     */
    public select(node: HierarchicalNode): void {
        const tree = this.tree().map(item => ({
            ...item,
            selected: item.path === node.path,
        }));

        this.update({ tree });
    }

    /**
     * Computes the SVG path `d` attribute for the connector between a link's source and target
     * node, routed as a right-angle elbow — horizontal-vertical-horizontal when {@link horizontal}
     * is on, vertical-horizontal-vertical otherwise.
     * @param link The d3-hierarchy link to draw.
     */
    public linkPath(link: d3.HierarchyPointLink<HierarchicalNode>): string {
        const sx = this.nx(link.source);
        const sy = this.ny(link.source);
        const tx = this.nx(link.target);
        const ty = this.ny(link.target);

        if (this.horizontal()) {
            const x1 = sx + 85; // half box width
            const x2 = tx - 85;
            const mid = (x1 + x2) / 2;
            return `M${x1},${sy} H${mid} V${ty} H${x2}`;
        }

        const y1 = sy + 28; // half box height
        const y2 = ty - 28;
        const mid = (y1 + y2) / 2;
        return `M${sx},${y1} V${mid} H${tx} V${y2}`;
    }

    //
    // Tree building (walking the Hierarchical Structures submodel's Entity/RelationshipElement graph)
    //

    private createNode(
        archeType: ArcheType,
        parent: aas.Entity | null,
        node: aas.Entity,
        level: number,
        path: string,
        parentPath?: string,
    ): HierarchicalNode {
        let isLeaf = true;
        let hasChildren = false;
        if (archeType === 'Full' || (archeType === 'OneDown' && this.isEntryNode(node))) {
            if (node.statements && node.statements.some(item => isEntity(item) && this.isNode(item))) {
                isLeaf = false;
                hasChildren = true;
            }
        }

        const item: HierarchicalNode = {
            parentId: this.determineParent(parent, node),
            id: node,
            path,
            level,
            symbolType: 'text',
            symbol: getAbbreviation(node.modelType)!,
            expanded: level === 0,
            selected: false,
            highlighted: false,
            loaded: false,
            type: 'text',
            name: getDisplayName(node, untracked(this.document)?.content, untracked(this.currentLang)),
            suffix: node.globalAssetId,
            isLeaf,
            hasChildren,
            options: { archeType, parentPath },
        };

        return item;
    }

    private createTree(archeType: ArcheType, entryNode: aas.Entity): Tree<aas.Entity, NodeOptions> {
        const tree: Tree<aas.Entity, NodeOptions> = [];
        if (!entryNode.globalAssetId || this.visited.has(entryNode.globalAssetId)) {
            return tree;
        }

        const rootItem = this.createNode(archeType, null, entryNode, 0, entryNode.idShort);
        if (!rootItem.isLeaf) {
            rootItem.loaded = true;
        }

        if (archeType === 'Full' || archeType === 'OneDown') {
            tree.push(rootItem);
            if (entryNode.statements) {
                this.createChildren(rootItem, tree);
            }
        } else {
            throw new Error('Not implemented.');
        }

        return tree;
    }

    private determineParent(parent: aas.Entity | null, node: aas.Entity): aas.Entity | null {
        if (!node.statements) {
            return parent;
        }

        for (const statement of node.statements) {
            if (isRelationshipElement(statement) && statement.first && statement.second) {
                const connection = this.getLogicalConnection(statement);
                const first = this.resolveReference(statement.first);
                const second = this.resolveReference(statement.second);
                if (!connection || !isEntity(first) || !isEntity(second)) {
                    continue;
                }

                if (second === node && connection === 'IsPartOf') {
                    return first;
                }
            }
        }

        return parent;
    }

    private createChildren(parentItem: HierarchicalNode, items: HierarchicalNode[]): void {
        const parent = parentItem.id;
        const archeType = parentItem.options.archeType;
        if (!parent.statements) {
            return;
        }

        const nodes = parent.statements.filter(statement => isEntity(statement));
        const level = parentItem.level + 1;
        for (const node of nodes) {
            const item = this.createNode(
                archeType,
                parent,
                node,
                level,
                `${parentItem.path}.${node.idShort}`,
                parentItem.path,
            );
            if (node.globalAssetId) {
                this.visited.add(node.globalAssetId);
            }

            items.push(item);
        }
    }

    private findHierarchicalStructure(content: aas.Environment): aas.Submodel | undefined {
        return content.submodels?.find(submodel => {
            const semanticId = getSemanticId(submodel);
            return semanticId === HIERARCHICAL_STRUCTURES_1_1 || semanticId === HIERARCHICAL_STRUCTURES_1_0;
        });
    }

    private getArcheType(submodel: aas.Submodel): ArcheType | undefined {
        const referable = submodel.submodelElements?.find(element => getSemanticId(element) === ARCHE_TYPE);
        return isProperty(referable) ? (referable.value as ArcheType) : undefined;
    }

    private getEntryNode(submodel: aas.Submodel): aas.Entity | undefined {
        const referable = submodel.submodelElements?.find(element => getSemanticId(element) === ENTRY_NODE);
        return isEntity(referable) ? referable : undefined;
    }

    private getLogicalConnection(relation: aas.RelationshipElement): 'SameAs' | 'IsPartOf' | 'HasPart' | undefined {
        const semanticId = getSemanticId(relation);
        if (semanticId === SAME_AS) {
            return 'SameAs';
        } else if (semanticId === IS_PART_OF) {
            return 'IsPartOf';
        } else if (semanticId === HAS_PART) {
            return 'HasPart';
        }

        return undefined;
    }

    private isNode(node: aas.Entity): boolean {
        return getSemanticId(node) === NODE;
    }

    private isEntryNode(node: aas.Entity): boolean {
        return getSemanticId(node) === ENTRY_NODE;
    }

    private resolveReference(reference: aas.Reference): aas.Entity | undefined {
        let referable: aas.Referable | undefined;
        if (reference.type === 'ModelReference') {
            let children = untracked(this.submodel)?.submodelElements ?? [];
            for (const key of reference.keys) {
                referable = children.find(child => child.idShort === key.value);
                if (!referable) {
                    break;
                }

                children = getChildren(referable);
            }
        } else {
            referable = getReferenced(untracked(this.env), reference);
        }

        return isEntity(referable) ? referable : undefined;
    }
}
