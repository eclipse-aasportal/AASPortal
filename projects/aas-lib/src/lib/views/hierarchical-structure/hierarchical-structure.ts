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
import { encodeBase64Url, findRouteForShell, getDisplayName } from '../../utilities';
import { HIERARCHICAL_STRUCTURES_1_0, HIERARCHICAL_STRUCTURES_1_1 } from '../views-constants';
import { ChildComponent2 } from '../../components/child-component';
import { VIEW_ROUTES } from '../views-routes';
import { Tree, TreeComponent, TreeNode, TreeService } from '../../components/tree/tree.component';

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
            this.createTree(archeType, null, entryNode, 0, tree, entryNode.idShort);
            this.state.update({ tree });
        });

        this.subject
            .pipe(
                takeUntilDestroyed(),
                concatMap(node => {
                    const globalAssetId = (node.id as aas.Entity).globalAssetId;
                    if (!globalAssetId || node.options.document) {
                        return of();
                    }

                    return this.api.getDocument('Asset', globalAssetId).pipe(
                        catchError(() => of(null)),
                        map(document => {
                            const shell = document?.content?.assetAdministrationShells.at(0);
                            if (!shell) {
                                return { ...node, options: { ...node.options, document } } satisfies TreeNode;
                            }

                            return {
                                ...node,
                                symbolType: 'image',
                                symbol: document!.thumbnail,
                                type: 'routerLink',
                                name: getDisplayName(shell, document?.content, this.currentLang()),
                                suffix: document?.id,
                                options: { ...node.options, document },
                            } satisfies TreeNode;
                        }),
                    );
                }),
            )
            .subscribe(node => {
                const tree: Tree = this.state.tree().map(item => {
                    return item.path === node.path ? node : item;
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

    public readonly service = signal<TreeService>(this).asReadonly();

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

    public loadChildren(node: TreeNode): TreeNode[] {
        const items: TreeNode[] = [];
        const archeType = node.options.archeType as ArcheType;
        const entity = node.id as aas.Entity;
        if (archeType === 'Full') {
            this.createChildren(archeType, entity, node.level, node.path, items);
        } else if (archeType === 'OneDown') {
            const content = (node.options.document as AASDocument)?.content;
            if (content) {
                const submodel = this.findHierarchicalStructure(content);
                if (!submodel) {
                    return items;
                }

                const archeType = this.getArcheType(submodel);
                const entryNode = this.getEntryNode(submodel);
                if (!entryNode) {
                    return items;
                }

                if (archeType === 'Full' || archeType === 'OneDown') {
                    this.createChildren(archeType, entryNode, node.level, node.path, items);
                }
            }
        }

        return items;
    }

    public setTree(tree: Tree): void {
        this.state.update({ tree });
    }

    private createTree(
        archeType: ArcheType,
        parent: aas.Entity | null,
        node: aas.Entity,
        level: number,
        data: Tree,
        path: string,
    ): void {
        if (!node.globalAssetId || this.visited.has(node.globalAssetId)) {
            return;
        }

        const item: TreeNode = {
            parent,
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
            isLeaf: true,
            hasChildren: false,
            options: { archeType },
        };

        this.subject.next(item);
        if (node.globalAssetId) {
            this.visited.add(node.globalAssetId);
        }

        if (archeType === 'Full' || archeType === 'OneDown') {
            item.parent = this.determineParent(parent, node);
            data.push(item);
            if (node.statements) {
                for (const statement of node.statements) {
                    if (this.isNode(statement)) {
                        item.isLeaf = false;
                        item.hasChildren = true;
                        if (item.expanded) {
                            this.createTree(
                                archeType,
                                node,
                                statement,
                                level + 1,
                                data,
                                `${path}.${statement.idShort}`,
                            );
                            item.loaded = true;
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
                item.parent = statement;
                this.subject.next(parentNode);
                data.push(parentNode);
                data.push(item);
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
            parent: null,
            id: node,
            path: node.idShort,
            level,
            type: 'text',
            name: getDisplayName(node, untracked(this.document)?.content, this.currentLang()),
            suffix: node.globalAssetId,
            symbolType: 'text',
            symbol: getAbbreviation(node.modelType)!,
            expanded: false,
            selected: false,
            highlighted: false,
            loaded: false,
            isLeaf: false,
            hasChildren: true,
            options: { archeType: 'OneUp' },
        };
    }

    private oneLevelDown(parentNode: TreeNode, data: Tree): void {
        const parent = parentNode.id as aas.Entity;
        for (let i = 0, n = data.length; i < n; i++) {
            const item = data[i];
            if (item.parent !== parent) {
                continue;
            }

            item.path = parent.idShort + '.' + item.path;
            item.level = parentNode.level + 1;
            this.oneLevelDown(item, data);
        }
    }

    private isNode(statement: aas.SubmodelElement): statement is aas.Entity {
        return isEntity(statement) && getSemanticId(statement) === NODE;
    }

    private createChildren(
        archeType: ArcheType,
        parent: aas.Entity,
        level: number,
        parentId: string,
        items: TreeNode[],
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
