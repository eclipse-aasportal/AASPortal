/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
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
    noop,
    selectReferable,
} from 'aas-core';

import { ArcheType, HierarchicalStructureState } from './hierarchical-structure.state';
import { EndpointsApi } from '../../services/endpoints-api';
import { encodeBase64Url, findRouteForShell, findSubmodel, getDisplayName } from '../../utilities';
import { HIERARCHICAL_STRUCTURES_1_0, HIERARCHICAL_STRUCTURES_1_1 } from '../views-constants';
import { ChildComponent2 } from '../../components/child-component';
import { VIEW_ROUTES } from '../views-routes';
import { Tree, TreeComponent, TreeNode, TreeResult, TreeService } from '../../components/tree/tree.component';

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
    imports: [FormsModule, TreeComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HierarchicalStructure extends ChildComponent2 implements TreeService {
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
            this.visited.clear();
            this.createTree(archeType, entryNode, tree);
            this.state.update({ tree });
            tree.forEach(item => this.loaded(item));
        });

        this.subject
            .pipe(
                takeUntilDestroyed(),
                concatMap(item => {
                    const globalAssetId = (item.id as aas.Entity).globalAssetId;
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
                const tree: Tree = this.state.tree().map(obj => {
                    if (!document || obj !== item) {
                        return obj;
                    }

                    return this.updateNode(item, document);
                });

                this.state.update({ tree });
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
     * Read-only signal exposing the TreeService instance associated with this view.
     */
    public readonly service = signal<TreeService>(this).asReadonly();

    /**
     * Read-only reference to the hierarchical tree model used by this view.
     */
    public readonly tree = this.state.tree;

    /**
     * Returns the thumbnail URL for a given tree node.
     * If the node has a thumbnail property, it returns that value.
     * Otherwise, it returns the default thumbnail path.
     *
     * @param node - The tree node for which to retrieve the thumbnail.
     * @returns The URL of the thumbnail image.
     */
    public getThumbnail(node: TreeNode): string {
        if (node.symbol) {
            return node.symbol;
        }

        return '/assets/resources/aas-idta.png';
    }

    /** Not relevant. */
    public getUrl(node: TreeNode): string {
        noop(node);
        return '';
    }

    /**
     * Generates a route link to a specific view for the specified node.
     *
     * @param node - The tree node containing a document for which to generate the route link.
     * @returns An array representing the route link, including the route path and encoded document properties,
     *          or `undefined` if no valid document or route is found.
     */
    public getRouterLink(node: TreeNode): unknown[] | undefined {
        const document = node.options.document as AASDocument;
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
    public loadChildren(parent: TreeNode): TreeResult | undefined {
        const children: TreeNode[] = [];
        const parentArcheType = parent.options.archeType as ArcheType;
        if (parentArcheType === 'Full') {
            this.createChildren(parent, children);
        } else if (parentArcheType === 'OneDown') {
            const env = (parent.options.document as AASDocument)?.content;
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
                    options: { ...parent.options, node: parent },
                };

                if (archeType === 'Full' || archeType === 'OneDown') {
                    this.createChildren(parent, children);
                }
            }
        }

        return { parent, children };
    }

    /**
     * Loads the Asset Administration Shell that corresponds the globalAssetId of the specified node.
     *
     * @param item The loaded node.
     */
    public loaded(item: TreeNode): void {
        this.subject.next(item);
    }

    /**
     * Set the current hierarchical tree in the component's state.
     *
     * @param tree - The Tree instance or data object to store as the current tree.
     */
    public setTree(tree: Tree): void {
        this.state.update({ tree });
    }

    private updateNode(item: TreeNode, document: AASDocument | null): TreeNode {
        const shell = document?.content?.assetAdministrationShells.at(0);
        if (!shell) {
            return { ...item, options: { ...item.options, document } } satisfies TreeNode;
        }

        const update: TreeNode = {
            ...item,
            symbolType: 'image',
            symbol: document!.thumbnail,
            type: 'routerLink',
            name: getDisplayName(shell, document?.content, this.currentLang()),
            suffix: document?.id,
            options: { ...item.options, document },
        };

        const node = item.id as aas.Entity;
        const archeType = item.options.archeType as ArcheType;
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
                update.hasChildren =
                    entryNode.statements !== undefined &&
                    entryNode.statements.some(statement => isEntity(statement) && this.isNode(statement));
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
    ): TreeNode {
        let isLeaf = true;
        let hasChildren = false;
        if (archeType === 'Full' || (archeType === 'OneDown' && this.isEntryNode(node))) {
            if (node.statements && node.statements.some(item => isEntity(item) && this.isNode(item))) {
                isLeaf = false;
                hasChildren = true;
            }
        }

        const item: TreeNode = {
            parent: this.determineParent(parent, node),
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

    private createTree(archeType: ArcheType, entryNode: aas.Entity, tree: Tree): void {
        if (!entryNode.globalAssetId || this.visited.has(entryNode.globalAssetId)) {
            return;
        }

        const rootItem = this.createNode(archeType, null, entryNode, 0, entryNode.idShort);
        rootItem.loaded = true;
        if (archeType === 'Full' || archeType === 'OneDown') {
            tree.push(rootItem);
            if (entryNode.statements) {
                this.createChildren(rootItem, tree);
            }
        } else {
            throw new Error('Not implemented.');
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

    private createChildren(parentItem: TreeNode, items: TreeNode[]): void {
        const parent = parentItem.id as aas.Entity;
        const archeType = parentItem.options.archeType as ArcheType;
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
