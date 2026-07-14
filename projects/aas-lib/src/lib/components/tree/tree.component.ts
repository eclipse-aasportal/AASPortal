/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { FormsModule } from '@angular/forms';
import { RouterLinkWithHref } from '@angular/router';
import {
    AfterViewInit,
    Component,
    computed,
    DOCUMENT,
    effect,
    inject,
    input,
    OnDestroy,
    signal,
    untracked,
    WritableSignal,
} from '@angular/core';

import { noop } from 'aas-core';
import { WINDOW } from '../../services/window.service';
import { ChildComponent } from '../child-component';
import { MaxLengthPipe } from '../../share/pipes/max-length.pipe';

export type TreeId = string | number | object;

export type TreeSymbolType = 'image' | 'text';

export type TreeType = 'text' | 'routerLink' | 'url';

export type TreeValueType = 'text' | 'url' | 'signal';

export type TreeNode<TId = TreeId, TOptions = Record<string, unknown>> = {
    parentId: TId | null;
    id: TId;
    path: string;
    level: number;
    name: string;
    suffix?: string;
    selected: boolean;
    highlighted: boolean;
    isLeaf: boolean;
    symbolType: TreeSymbolType;
    symbol?: string;
    type: TreeType;
    valueType?: TreeValueType;
    value?: string | WritableSignal<string | undefined>;
    options: TOptions;
} & (
    | {
          isLeaf: true;
      }
    | {
          isLeaf: false;
          loaded: boolean;
          expanded: boolean;
          hasChildren: boolean;
      }
);

export type Tree<TId = TreeId, TOptions = Record<string, unknown>> = TreeNode<TId, TOptions>[];

export type TreeResult<TId = TreeId, TOptions = Record<string, unknown>> = {
    parent: TreeNode<TId, TOptions>;
    children: TreeNode<TId, TOptions>[];
};

export type TreeData<TId = TreeId, TOptions = Record<string, unknown>> = {
    tree: Tree<TId, TOptions>;
    matchIndex: number;
    selectionDisabled: boolean;
};

@Component({
    selector: 'fhg-tree',
    imports: [FormsModule, RouterLinkWithHref, MaxLengthPipe],
    templateUrl: './tree.component.html',
    styleUrl: './tree.component.scss',
})
export abstract class TreeComponent<TId = TreeId, TOptions = Record<string, unknown>>
    extends ChildComponent
    implements OnDestroy, AfterViewInit
{
    private readonly dom = inject(DOCUMENT);
    private readonly window = inject(WINDOW);
    private readonly tree$ = signal<Tree<TId, TOptions>>([]);
    private readonly matchIndex$ = signal(-1);
    private readonly selectionDisabled$ = signal(false);
    private shiftKey = false;
    private altKey = false;

    protected constructor() {
        super();

        effect(() => {
            const matchIndex = this.matchIndex();
            if (!matchIndex || matchIndex < 0) {
                const tree = untracked(this.tree).map(item =>
                    item.highlighted ? { ...item, highlight: false } : item,
                );

                this.update({ tree });
                return;
            }

            const { tree, loaded } = this.loadTree();
            let node = tree[matchIndex];
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
            loaded.forEach(node => this.loaded(node));
        });

        effect(() => {
            this.start(this.loadAll(), this.searchExpression());
        });

        this.window.addEventListener('keyup', this.keyup);
        this.window.addEventListener('keydown', this.keydown);
    }

    /**
     * The current search expression.
     */
    public readonly searchExpression = input<string | undefined>(undefined);

    /**
     * Determines whether tree nodes can be selected.
     * @default false
     */
    public readonly allowSelection = input(false);

    /**
     * Enables or disables the value display in the tree component.
     * @default false
     */
    public readonly enableValue = input(false);

    /**
     * The nodes of the hierarchical structure.
     */
    public readonly tree = this.tree$.asReadonly();

    /**
     * The index of the current match in a search operation.
     */
    public readonly matchIndex = this.matchIndex$.asReadonly();

    /**
     * The selected tree nodes.
     */
    public readonly selectedNodes = computed(() => this.tree().filter(node => node.selected));

    /**
     * The currently highlighted tree node.
     */
    public readonly highlighted = computed(() => this.tree().find(node => node.highlighted));

    /**
     * Enables or disables selection in the tree component.
     */
    public readonly selectionDisabled = this.selectionDisabled$.asReadonly();

    /**
     * The visible nodes in the hierarchical structure tree.
     */
    public readonly nodes = computed(() => {
        const tree = this.tree();
        const nodes: TreeNode<TId, TOptions>[] = [];
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
            if (!this.hasChildren(node)) {
                continue;
            }

            if (!this.isExpanded(node)) {
                return false;
            }
        }

        return true;
    });

    public ngOnDestroy(): void {
        this.window.removeEventListener('keyup', this.keyup);
        this.window.removeEventListener('keydown', this.keydown);
    }

    public ngAfterViewInit(): void {
        const root = untracked(this.tree).find(node => node.parentId === null);
        if (root) {
            this.expandNode(root);
        }
    }

    /**
     * Expands a specific tree node if provided, or expands all nodes if no node is specified.
     *
     * @param node - The tree node to expand. If omitted, all nodes will be expanded.
     */
    public expand(node?: TreeNode<TId, TOptions>): void {
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
    public collapse(node?: TreeNode<TId, TOptions>): void {
        if (node) {
            this.collapseNode(node);
        } else {
            this.collapseAll();
        }
    }

    /**
     * Gets a link to a route that belongs to the specified node.
     *
     * @param node The current node.
     * @returns A link to a route.
     */
    public getRouterLink(node: TreeNode<TId, TOptions>): unknown[] | undefined {
        noop(node);
        return undefined;
    }

    /**
     * Returns an URL to a resource that belongs to the specified node.
     *
     * @param node The current node.
     * @returns An URL to a resource that belongs to the current node.
     */
    public getUrl(node: TreeNode<TId, TOptions>): string | undefined {
        noop(node);
        return undefined;
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
    public toggleSelection(node?: TreeNode<TId, TOptions>): void {
        node ? this.toggleNode(node) : this.everySelected() ? this.deselectAll() : this.selectAll();
    }

    /**
     * Determines whether a tree node is expanded.
     * @param node - The tree node to check.
     * @returns `true` if the node is not a leaf and is expanded; otherwise `false`.
     */
    public isExpanded(node: TreeNode<TId, TOptions>): boolean {
        return !node.isLeaf && node.expanded;
    }

    /**
     * Determines whether a composite tree node has been loaded.
     * @param node - The tree node to check.
     * @returns `true` if the node is a leaf or has been loaded; otherwise `false`.
     */
    public isLoaded(node: TreeNode<TId, TOptions>): boolean {
        return node.isLeaf || node.loaded;
    }

    /**
     * Determines whether a composite tree node has children.
     * @param node - The tree node to check.
     * @returns `true` if the node is not a leaf and has children; otherwise `false`.
     */
    public hasChildren(node: TreeNode<TId, TOptions>): boolean {
        return !node.isLeaf && node.hasChildren;
    }

    /**
     * Reads and unwraps a value that can be either a string, a WritableSignal, or undefined.
     * If the value is a function (WritableSignal), it invokes it to get the current value.
     * Otherwise, it returns the value as-is.
     *
     * @param value - The value to read, which can be a string, WritableSignal<string | undefined>, or undefined
     * @returns The unwrapped string value, or undefined if the input is undefined or the signal resolves to undefined
     */
    public readValue(value: string | WritableSignal<string | undefined> | undefined): string | undefined {
        return typeof value === 'function' ? value() : value;
    }

    /**
     * Loads the children of the specified parent node.
     *
     * @param node The parent node.
     * @return The loaded children.
     */
    protected abstract loadChildren(node: TreeNode<TId, TOptions>): TreeResult<TId, TOptions> | undefined;

    /**
     * Called after loading a node for further operations.
     *
     * @param node The loaded tree node.
     */
    protected abstract loaded(node: TreeNode<TId, TOptions>): void;

    /**
     * Starts a search operation.
     *
     * @param nodes The nodes to include in the search.
     * @param searchExpression The search expression.
     */
    protected abstract start(nodes: TreeNode<TId, TOptions>[], searchExpression: string | undefined): void;

    /**
     * Updates the tree component state with the provided partial data.
     *
     * @param newState - Partial tree data containing updates to apply
     * @param newState.tree - The new tree structure to set, if provided
     */
    protected update(newState: Partial<TreeData<TId, TOptions>>): void {
        if (newState.tree !== undefined) {
            this.tree$.set(newState.tree);
        }

        if (newState.matchIndex !== undefined) {
            this.matchIndex$.set(newState.matchIndex);
        }

        if (newState.selectionDisabled !== undefined) {
            this.selectionDisabled$.set(newState.selectionDisabled);
        }
    }

    private toggleNode(node: TreeNode<TId, TOptions>): void {
        let tree: Tree<TId, TOptions>;
        if (this.altKey) {
            tree = this.tree().map(item => {
                if (node === item) {
                    return { ...item, selected: !item.selected };
                }

                if (item.selected) {
                    return { ...item, selected: false };
                }

                return item;
            });
        } else if (this.shiftKey) {
            const nodes = this.nodes();
            const index = nodes.indexOf(node);
            let begin = index;
            let end = index;
            const selection = nodes.map(item => item.selected);
            const last = selection.lastIndexOf(true);
            if (last >= 0) {
                if (last > index) {
                    begin = index;
                    end = selection.indexOf(true);
                } else if (last < index) {
                    begin = last;
                    end = index;
                }
            }

            const set = new Set(nodes.slice(begin, end + 1));
            tree = this.tree().map(item => {
                if (set.has(item)) {
                    return item.selected ? item : { ...item, selected: true };
                }

                return item.selected ? { ...item, selected: false } : item;
            });
        } else {
            tree = this.tree().map(item => {
                return node === item ? { ...item, selected: !item.selected } : item;
            });
        }

        this.update({ tree });
    }

    private deselectAll(): void {
        const tree = this.tree().map(item => ({ ...item, selected: false }));
        this.update({ tree });
    }

    private selectAll(): void {
        const { tree, loaded } = this.loadTree();
        for (let i = 0, n = tree.length; i < n; i++) {
            const node = tree[i];
            if (!node.selected) {
                tree[i] = { ...node, selected: true };
            }
        }

        this.update({ tree });
        loaded.forEach(node => this.loaded(node));
    }

    private ensureExpanded(tree: Tree<TId, TOptions>, node: TreeNode<TId, TOptions>): void {
        while (node) {
            const index = tree.findIndex(item => item.id === node.parentId);
            if (index < 0 || this.isExpanded(tree[index])) {
                break;
            }

            const parent = { ...tree[index], expanded: true };
            tree[index] = parent;
            node = parent;
        }
    }

    private scrollIntoView(id: string): void {
        setTimeout(() => {
            const element = this.dom.getElementById(id);
            element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        });
    }

    private buildTree(tree: Tree<TId, TOptions>, parent: TId | null, nodes: TreeNode<TId, TOptions>[]): void {
        for (const child of tree.filter(item => item.parentId === parent)) {
            nodes.push(child);
            if (this.isExpanded(child)) {
                this.buildTree(tree, child.id, nodes);
            }
        }
    }

    private expandNode(node: TreeNode<TId, TOptions>): void {
        const children: TreeNode<TId, TOptions>[] = [];
        const tree = this.tree().map(item => {
            if (item !== node) {
                return item;
            }

            if (!this.isLoaded(node)) {
                const result = this.loadChildren(node);
                if (!result) {
                    return { ...node, hasChildren: false, expanded: true, loaded: true };
                }

                children.push(...result.children);
                return { ...result.parent, expanded: true, loaded: true, hasChildren: result.children.length > 0 };
            } else {
                return { ...node, expanded: true, loaded: true };
            }
        });

        tree.push(...children);
        this.update({ tree });
        children.forEach(node => this.loaded(node));
    }

    private expandAll(): void {
        const { tree, loaded } = this.loadTree(true);
        this.update({ tree });
        loaded.forEach(item => this.loaded(item));
    }

    private loadAll(): TreeNode<TId, TOptions>[] {
        const { tree, loaded } = this.loadTree();
        this.update({ tree });
        loaded.forEach(item => this.loaded(item));
        return untracked(this.tree);
    }

    private loadTree(expand: boolean = false): { tree: Tree<TId, TOptions>; loaded: TreeNode<TId, TOptions>[] } {
        const tree = [...untracked(this.tree)];
        const loaded: TreeNode<TId, TOptions>[] = [];
        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];
            if (node.isLeaf || !node.hasChildren) {
                continue;
            }

            if (!node.loaded) {
                const result = this.loadChildren(node);
                if (!result) {
                    tree[i] = { ...node, loaded: true, expanded: expand, hasChildren: false };
                } else {
                    tree.push(...result.children);
                    loaded.push(...result.children);
                    tree[i] = { ...node, loaded: true, expanded: expand, hasChildren: result.children.length > 0 };
                }
            } else if (expand && !node.expanded) {
                tree[i] = { ...node, expanded: expand };
            }
        }

        return { tree, loaded };
    }

    private collapseNode(node: TreeNode<TId, TOptions>): void {
        const tree = this.tree().map(item => {
            return item === node ? { ...item, expanded: false } : item;
        });

        this.update({ tree });
    }

    private collapseAll(): void {
        const tree = this.tree().map(item => {
            return !item.isLeaf && item.expanded ? { ...item, expanded: false } : item;
        });

        this.update({ tree });
    }

    private keyup = (): void => {
        this.shiftKey = false;
        this.altKey = false;
    };

    private keydown = (event: KeyboardEvent): void => {
        this.shiftKey = event.shiftKey;
        this.altKey = event.altKey;
    };
}
