/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { catchError, concatMap, map, of, Subject } from 'rxjs';

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

import { EndpointsApi } from '../../services/endpoints-api';
import { encodeBase64Url, findRouteForShell, findSubmodel, getDisplayName } from '../../utilities';
import { HIERARCHICAL_STRUCTURES_1_0, HIERARCHICAL_STRUCTURES_1_1 } from '../views-constants';
import { VIEW_ROUTES } from '../views-routes';
import { Tree, TreeComponent, TreeNode, TreeResult } from '../../components/tree/tree.component';
import { RouterLinkWithHref } from '@angular/router';
import { MaxLengthPipe } from '../../pipes/max-length.pipe';

export type ArcheType = 'Full' | 'OneDown' | 'OneUp';

export type NodeOptions = {
    archeType: ArcheType;
    document?: AASDocument | null;
    node?: aas.Entity;
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
    templateUrl: '../../components/tree/tree.component.html',
    styleUrl: '../../components/tree/tree.component.scss',
    imports: [FormsModule, RouterLinkWithHref, MaxLengthPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HierarchicalStructure extends TreeComponent<aas.Entity, NodeOptions> {
    private readonly api = inject(EndpointsApi);
    private readonly viewRoutes = inject(VIEW_ROUTES);
    private readonly subject = new Subject<HierarchicalNode>();
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
            if (!entryNode || !archeType || untracked(this.tree).at(0)?.id === entryNode) {
                return;
            }

            this.visited.clear();
            const tree = this.createTree(archeType, entryNode);
            this.update({ tree });
            tree.forEach(item => this.loaded(item));
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
                    );
                }),
            )
            .subscribe(({ document, item }) => {
                const tree = this.tree().map(obj => {
                    if (!document || obj !== item) {
                        return obj;
                    }

                    return this.updateNode(item, document);
                });

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
     * Generates a route link to a specific view for the specified node.
     *
     * @param node - The tree node containing a document for which to generate the route link.
     * @returns An array representing the route link, including the route path and encoded document properties,
     *          or `undefined` if no valid document or route is found.
     */
    public override getRouterLink(node: HierarchicalNode): unknown[] | undefined {
        const document = node.options.document;
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
                    options: { ...parent.options, node: parent.id },
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
        this.subject.next(item);
    }

    /**
     * Not relevant.
     */
    protected override start(nodes: HierarchicalNode[], searchExpression: string | undefined): void {
        noop(nodes, searchExpression);
    }

    private updateNode(item: HierarchicalNode, document: AASDocument | null): HierarchicalNode {
        const shell = document?.content?.assetAdministrationShells.at(0);
        if (!shell) {
            return { ...item, options: { ...item.options, document } } satisfies HierarchicalNode;
        }

        const update: HierarchicalNode = {
            ...item,
            symbolType: 'image',
            symbol: document!.thumbnail,
            type: 'routerLink',
            name: getDisplayName(shell, document?.content, this.translate.getCurrentLang()),
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

    private createNode(
        archeType: ArcheType,
        parent: aas.Entity | null,
        node: aas.Entity,
        level: number,
        path: string,
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
            options: { archeType },
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
            const item = this.createNode(archeType, parent, node, level, `${parentItem.path}.${node.idShort}`);
            if (node.globalAssetId) {
                this.visited.add(node.globalAssetId);
            }

            items.push(item);
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
