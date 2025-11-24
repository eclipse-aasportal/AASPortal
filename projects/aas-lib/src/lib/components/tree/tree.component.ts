/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, computed, DOCUMENT, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLinkWithHref } from '@angular/router';

export type TreeId = string | number | object;

export type TreeNode = {
    parent: TreeId | null;
    id: TreeId;
    path: string;
    level: number;
    name: string;
    suffix?: string;
    expanded: boolean;
    selected: boolean;
    highlighted: boolean;
    loaded: boolean;
    isLeaf: boolean;
    hasChildren: boolean;
    symbolType: 'image' | 'text';
    symbol?: string;
    type: 'text' | 'routerLink' | 'url';
    options: Record<string, unknown>;
};

export type Tree = TreeNode[];

/**
 *
 */
export interface TreeService {
    /**
     *
     * @param node The current node.
     * @returns
     */
    getThumbnail(node: TreeNode): string;

    /**
     * Loads the children of the specified parent node.
     * @param node The parent node.
     * @return The loaded children.
     */
    loadChildren(node: TreeNode): TreeNode[];

    /**
     *
     * @param node The current node.
     */
    getRouterLink(node: TreeNode): unknown[] | undefined;

    /**
     *
     * @param node The node
     */
    getUrl(node: TreeNode): string;
}

type TreeData = {
    tree: Tree;
};

@Component({
    selector: 'fhg-tree',
    imports: [FormsModule, RouterLinkWithHref],
    templateUrl: './tree.component.html',
    styleUrl: './tree.component.scss',
})
export class TreeComponent {
    private readonly document = inject(DOCUMENT);

    /**
     * The nodes of the hierarchical structure.
     */
    public readonly tree = model<Tree>([]);

    /**
     * Service used by the tree component to manage tree data and operations.
     */
    public readonly service = input.required<TreeService>();

    /**
     * Determines the selection mode for the tree component.
     *
     * - `'no'`: Selection is disabled.
     * - `'single'`: Only one item can be selected at a time.
     * - `'multi'`: Multiple items can be selected simultaneously.
     *
     * This property is read-only and is set via an input binding.
     */
    public readonly selectionMode = input<'no' | 'single' | 'multi'>('no');

    /**
     * The visible nodes in the hierarchical structure tree.
     */
    public readonly nodes = computed(() => {
        const tree = this.tree();
        const nodes: TreeNode[] = [];
        this.buildTree(tree, null, nodes);
        return nodes;
    });

    /**
     * Indicates whether the tree has a partial selection.
     */
    public readonly someSelected = computed(() => {
        const tree = this.tree();
        return tree.some(node => node.selected) && !tree.every(node => node.selected);
    });

    /**
     * Indicates whether every node in the tree is selected.
     */
    public readonly everySelected = computed(() => this.tree().every(node => node.selected));

    /**
     * A computed property that determines whether all non-leaf nodes with children in the tree are expanded.
     */
    public readonly expanded = computed(() => {
        for (const node of this.tree()) {
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
     * Gets a thumbnail for the specified node.
     *
     * @param node The current node.
     * @returns An URL to a thumbnail.
     */
    public getThumbnail(node: TreeNode): string {
        return this.service().getThumbnail(node);
    }

    /**
     *
     * @param node The current node.
     * @returns
     */
    public getRouterLink(node: TreeNode): unknown[] | undefined {
        return this.service().getRouterLink(node);
    }

    /**
     * Returns an URL to a resource that belongs to the specified node.
     * @param node The current node.
     * @returns An URL to a resource that belongs to the current node.
     */
    public getUrl(node: TreeNode): string {
        return this.service().getUrl(node);
    }

    /**
     * Toggles selection state for a given tree node or for the entire tree.
     *
     * Behavior:
     * - If `node` is provided:
     *   - Toggles the `selected` flag of the provided node.
     *   - If `this.selectionMode()` returns `'single'`, any other node that is currently selected
     *     will be unselected (ensures only one node remains selected).
     * - If `node` is omitted:
     *   - If `everySelected` is true, clears selection on all nodes.
     *   - Otherwise, selects all nodes that are not currently selected.
     *
     * @param node - Optional tree node to toggle. When omitted, toggles selection state for the whole tree.
     */
    public toggleSelection(node?: TreeNode): void {
        let tree: Tree;
        if (node) {
            tree = this.tree().map(item => {
                if (node === item) {
                    return { ...item, selected: !item.selected };
                }

                if (this.selectionMode() === 'single' && item.selected) {
                    return { ...item, selected: false };
                }

                return item;
            });
        } else {
            if (this.everySelected()) {
                tree = this.tree().map(item => ({ ...item, selected: false }));
            } else {
                this.loadTree();
                tree = this.tree().map(item => {
                    if (item.selected) {
                        return item;
                    }

                    return { ...item, selected: true };
                });
            }
        }

        this.update({ tree });
    }

    /**
     * Highlight a node in the component's flattened tree representation.
     *
     * If `arg` is a number it will be resolved to a node using `this.at(this.tree(), arg)`.
     * The method produces a new `tree` array by mapping the current flattened tree:
     * - If an entry's node is strictly equal (`===`) to the resolved node, that node object
     *   is shallow-cloned with `highlighted: true`.
     * - If an entry's node is currently `selected`, that node object is shallow-cloned with
     *   `highlighted: false` (selected nodes are explicitly un-highlighted).
     * - All other entries are left unchanged.
     *
     * The component state is then updated by calling `this.update({ tree })`.
     *
     * @param arg - Optional. A TreeNode instance to highlight or an index (number) that will
     *              be resolved to a TreeNode via `this.at(this.tree(), arg)`. If omitted or
     *              if the index is out of range, no node will be marked `highlighted: true`.
     *
     * @returns void
     *
     * @remarks
     * - This method does not mutate the original node objects except for creating shallow
     *   clones for nodes whose `highlighted` value changes; the `tree` array reference is replaced.
     * - Comparison to find the node uses reference equality (`===`).
     * - There are no thrown errors documented by this method; invalid indices simply resolve to `undefined`.
     */
    public highlight(arg?: TreeNode | number): void {
        const tree = this.loadTree();
        let node = typeof arg === 'number' ? this.at(tree, arg) : arg;
        for (let i = 0, n = tree.length; i < n; i++) {
            const item = tree[i];
            if (node === item) {
                node = { ...item, highlighted: true };
                tree[i] = node;
            } else if (item.highlighted) {
                tree[i] = { ...item, highlighted: false };
            }
        }

        if (node && node.highlighted) {
            this.ensureExpanded(tree, node);
            this.scrollIntoView(node.path);
        }

        this.update({ tree });
    }

    private ensureExpanded(tree: Tree, node: TreeNode): void {
        while (node) {
            const index = tree.findIndex(item => item.id === node.parent);
            if (index < 0 || tree[index].expanded) {
                break;
            }

            const parent = { ...tree[index], expanded: true };
            tree[index] = parent;
            node = parent;
        }
    }

    private scrollIntoView(id: string): void {
        setTimeout(() => {
            const element = this.document.getElementById(id);
            element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        });
    }

    private buildTree(tree: Tree, parent: TreeId | null, nodes: TreeNode[]): void {
        for (const child of tree.filter(item => item.parent === parent)) {
            nodes.push(child);
            if (child.expanded) {
                this.buildTree(tree, child.id, nodes);
            }
        }
    }

    private at(tree: Tree, index: number, parent: TreeId | null = null, i = { index: 0 }): TreeNode | undefined {
        for (const child of tree.filter(item => item.parent === parent)) {
            if (index === i.index) {
                return child;
            }

            ++i.index;
            const node = this.at(tree, index, child.id, i);
            if (node) {
                return node;
            }
        }

        return undefined;
    }

    private expandNode(node: TreeNode): void {
        const children: TreeNode[] = [];
        const tree = this.tree().map(item => {
            if (item !== node) {
                return item;
            }

            if (!node.loaded) {
                children.push(...this.service().loadChildren(node));
            }

            return { ...item, expanded: true, loaded: true };
        });

        tree.push(...children);
        this.update({ tree });
    }

    private expandAll(): void {
        this.update({ tree: this.loadTree(true) });
    }

    private loadTree(expand: boolean = false): Tree {
        const tree = [...this.tree()];
        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];
            if (node.isLeaf || !node.hasChildren) {
                continue;
            }

            if (!node.loaded) {
                tree.push(...this.service().loadChildren(node));
                tree[i] = { ...node, loaded: true, expanded: expand };
            } else if (expand && !node.expanded) {
                tree[i] = { ...node, expanded: expand };
            }
        }

        return tree;
    }

    private collapseNode(node: TreeNode): void {
        const tree: Tree = this.tree().map(item => {
            return item === node ? { ...item, expanded: false } : item;
        });

        this.update({ tree });
    }

    private collapseAll(): void {
        const tree: Tree = this.tree().map(item => {
            return !item.isLeaf && item.expanded ? { ...item, expanded: false } : item;
        });

        this.update({ tree });
    }

    private update(newState: Partial<TreeData>): void {
        if (newState.tree !== undefined) {
            this.tree.set(newState.tree);
        }
    }
}
