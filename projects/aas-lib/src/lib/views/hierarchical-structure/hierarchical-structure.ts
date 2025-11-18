/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { FormsModule } from '@angular/forms';
import { RouterLinkWithHref } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { catchError, concatMap, map, of, Subject } from 'rxjs';

import {
    aas,
    AASDocument,
    getAbbreviation,
    getChildren,
    getSemanticId,
    isEntity,
    isProperty,
    isRelationshipElement,
    selectReferable,
} from 'aas-core';

import { ArcheType, HierarchicalStructureState, Tree, TreeItem, TreeNode } from './hierarchical-structure.state';
import { EndpointsApi } from '../../services/endpoints-api';
import { encodeBase64Url, findRouteForShell, getDisplayName } from '../../utilities';
import { HIERARCHICAL_STRUCTURES_1_0, HIERARCHICAL_STRUCTURES_1_1 } from '../views-constants';
import { ChildComponent2 } from '../../components/child-component';
import { VIEW_ROUTES } from '../views-routes';

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
    providers: [HierarchicalStructureState],
    imports: [FormsModule, RouterLinkWithHref],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HierarchicalStructure extends ChildComponent2 {
    private readonly state = inject(HierarchicalStructureState);
    private readonly api = inject(EndpointsApi);
    private readonly viewRoutes = inject(VIEW_ROUTES);
    private readonly subject = new Subject<TreeNode>();
    private readonly visited = new Set<string>();

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
            if (!entryNode || !archeType) {
                return;
            }

            const tree: Tree = [];
            this.createTree(archeType, null, entryNode, 0, tree, entryNode.idShort);
            this.state.update({ tree });
        });

        this.subject
            .pipe(
                takeUntilDestroyed(),
                concatMap(node => {
                    const globalAssetId = node.node.globalAssetId;
                    if (!globalAssetId || node.document) {
                        return of();
                    }

                    return this.api.getDocument('Asset', globalAssetId).pipe(
                        catchError(() => of(null)),
                        map(document => {
                            const shell = document?.content?.assetAdministrationShells.at(0);
                            if (!shell) {
                                return { ...node, document };
                            }

                            return {
                                ...node,
                                abbreviation: getAbbreviation(shell.modelType)!,
                                name: getDisplayName(shell, document?.content, this.currentLang()),
                                document,
                                thumbnail: document!.thumbnail,
                            } satisfies TreeNode;
                        }),
                    );
                }),
            )
            .subscribe(node => {
                const tree: Tree = this.state.tree().map(item => {
                    return item[1].id === node.id ? [item[0], node] : item;
                });

                this.state.update({ tree });
            });
    }

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
     * The visible nodes in the hierarchical structure tree.
     */
    public readonly nodes = computed(() => {
        const tree = this.state.tree();
        const nodes: TreeNode[] = [];
        const root = tree.find(item => item[0] === null);
        if (!root) {
            return nodes;
        }

        this.buildTree(tree, null, nodes);
        return nodes;
    });

    /**
     * A computed property that determines whether all non-leaf nodes with children in the tree are expanded.
     */
    public readonly expanded = computed(() => {
        for (const [, node] of this.state.tree()) {
            if (node.isLeaf || !node.hasChildren) {
                continue;
            }

            if (!node.expanded) {
                return false;
            }
        }

        return true;
    });

    /**
     * Returns the thumbnail URL for a given tree node.
     * If the node has a thumbnail property, it returns that value.
     * Otherwise, it returns the default thumbnail path.
     *
     * @param node - The tree node for which to retrieve the thumbnail.
     * @returns The URL of the thumbnail image.
     */
    public getThumbnail(node: TreeNode): string {
        if (node.thumbnail) {
            return node.thumbnail;
        }

        return '/assets/resources/aas-idta.png';
    }

    /**
     * Expands a specific tree node if provided, or expands all nodes if no node is specified.
     *
     * @param node - The tree node to expand. If omitted, all nodes will be expanded.
     */
    public expand(node?: TreeNode): void {
        if (node) {
            this.expandNode(node);
        } else {
            this.expandAll();
        }
    }

    /**
     * Collapses a specific tree node or all nodes in the hierarchical structure.
     *
     * @param node - The tree node to collapse. If omitted, all nodes will be collapsed.
     */
    public collapse(node?: TreeNode): void {
        if (node) {
            this.collapseNode(node);
        } else {
            this.collapseAll();
        }
    }

    /**
     * Generates a route link to a specific view for the specified node.
     *
     * @param node - The tree node containing a document for which to generate the route link.
     * @returns An array representing the route link, including the route path and encoded document properties,
     *          or `undefined` if no valid document or route is found.
     */
    public getRouterLink(node: TreeNode): unknown[] | undefined {
        const document = node.document;
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

    private expandNode(node: TreeNode): void {
        const loadedItems: TreeItem[] = [];
        const tree = this.state.tree().map<TreeItem>(item => {
            if (item[1] !== node) {
                return item;
            }

            if (!node.loaded) {
                this.loadChildren(node, loadedItems);
            }

            return [item[0], { ...item[1], expanded: true, loaded: true }];
        });

        tree.push(...loadedItems);
        this.state.update({ tree });
    }

    private expandAll(): void {
        const loadedItems: TreeItem[] = [];
        const tree = this.state.tree().map(item => {
            const treeNode = item[1];
            if (treeNode.isLeaf || treeNode.expanded) {
                return item;
            }

            if (!treeNode.loaded) {
                this.loadChildren(treeNode, loadedItems);
            }

            return [item[0], { ...treeNode, expanded: true, loaded: true }] as TreeItem;
        });

        tree.push(...loadedItems);
        this.state.update({ tree });
    }

    private collapseNode(node: TreeNode): void {
        const tree: Tree = this.state.tree().map(item => {
            const itemNode = item[1];
            return itemNode === node ? [item[0], { ...itemNode, expanded: false }] : item;
        });

        this.state.update({ tree });
    }

    private collapseAll(): void {
        const tree: Tree = this.state.tree().map(item => {
            const itemNode = item[1];
            return !itemNode.isLeaf && itemNode.expanded ? [item[0], { ...itemNode, expanded: false }] : item;
        });

        this.state.update({ tree });
    }

    private createTree(
        archeType: ArcheType,
        parent: aas.Entity | null,
        node: aas.Entity,
        level: number,
        data: Tree,
        id: string,
    ): void {
        if (!node.globalAssetId || this.visited.has(node.globalAssetId)) {
            return;
        }

        const treeNode: TreeNode = {
            archeType,
            id,
            level,
            abbreviation: getAbbreviation(node.modelType)!,
            node,
            expanded: level === 0,
            highlighted: false,
            loaded: false,
            name: getDisplayName(node, untracked(this.document)?.content, this.currentLang()),
            isLeaf: true,
            hasChildren: false,
        };

        this.subject.next(treeNode);
        if (node.globalAssetId) {
            this.visited.add(node.globalAssetId);
        }

        if (archeType === 'Full' || archeType === 'OneDown') {
            data.push([this.determineParent(parent, node), treeNode]);
            if (node.statements) {
                for (const statement of node.statements) {
                    if (this.isNode(statement)) {
                        treeNode.isLeaf = false;
                        treeNode.hasChildren = true;
                        if (treeNode.expanded) {
                            this.createTree(archeType, node, statement, level + 1, data, `${id}.${statement.idShort}`);
                            treeNode.loaded = true;
                        } else {
                            break;
                        }
                    }
                }
            }
        } else {
            const statement = node.statements?.find(statement => isEntity(statement));
            if (statement) {
                const parentNode = this.createParent(statement, level);
                this.subject.next(parentNode);
                data.push([null, parentNode]);
                data.push([parent, treeNode]);
                this.oneLevelDown(parentNode, data);
            }
        }
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

    private createParent(node: aas.Entity, level: number): TreeNode {
        return {
            archeType: 'OneUp',
            id: node.idShort,
            level,
            name: getDisplayName(node, untracked(this.document)?.content, this.currentLang()),
            abbreviation: getAbbreviation(node.modelType)!,
            node: node,
            expanded: false,
            highlighted: false,
            loaded: false,
            isLeaf: false,
            hasChildren: true,
        };
    }

    private oneLevelDown(parentNode: TreeNode, data: Tree): void {
        const parent = parentNode.node;
        for (let i = 0, n = data.length; i < n; i++) {
            const item = data[i];
            if (item[0] !== parent) {
                continue;
            }

            const child = item[1];
            child.id = parent.idShort + '.' + child.id;
            child.level = parentNode.level + 1;
            this.oneLevelDown(child, data);
        }
    }

    private isNode(statement: aas.SubmodelElement): statement is aas.Entity {
        return isEntity(statement) && getSemanticId(statement) === NODE;
    }

    private loadChildren(node: TreeNode, items: TreeItem[]): void {
        if (node.archeType === 'Full') {
            this.createChildren(node.archeType, node.node, node.level, node.id, items);
        } else if (node.archeType === 'OneDown') {
            const content = node.document?.content;
            if (content) {
                const submodel = this.findHierarchicalStructure(content);
                if (!submodel) {
                    return;
                }

                const archeType = this.getArcheType(submodel);
                const entryNode = this.getEntryNode(submodel);
                if (!entryNode) {
                    return;
                }

                if (archeType === 'Full' || archeType === 'OneDown') {
                    this.createChildren(archeType, entryNode, node.level, node.id, items);
                }
            }
        }
    }

    private createChildren(
        archeType: ArcheType,
        parent: aas.Entity,
        level: number,
        parentId: string,
        items: TreeItem[],
    ): void {
        for (const statement of parent.statements!) {
            if (isEntity(statement)) {
                this.createTree(archeType, parent, statement, level + 1, items, `${parentId}.${statement.idShort}`);
            }
        }
    }

    private findHierarchicalStructure(content: aas.Environment): aas.Submodel | undefined {
        return content.submodels.find(submodel => {
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

    private buildTree(data: Tree, parent: aas.Entity | null, nodes: TreeNode[]): void {
        const children = data.filter(item => item[0] === parent);
        for (const child of children) {
            nodes.push(child[1]);
            if (child[1].expanded) {
                this.buildTree(data, child[1].node, nodes);
            }
        }
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

    private resolveReference(reference: aas.Reference): aas.Entity | undefined {
        let referable: aas.Referable | undefined;
        if (reference.type === 'ModelReference') {
            let children = this.submodel()?.submodelElements ?? [];
            for (const key of reference.keys) {
                referable = children.find(child => child.idShort === key.value);
                if (!referable) {
                    break;
                }

                children = getChildren(referable);
            }
        } else {
            referable = selectReferable(untracked(this.env), reference);
        }

        return isEntity(referable) ? referable : undefined;
    }
}
