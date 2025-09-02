/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

/**
 * Represents a node in a tree.
 * @param TElement The base type of the encapsulated structure element.
 */
export abstract class TreeNode<TElement> {
    protected constructor(
        public readonly element: TElement,
        public readonly parent: number,
        public readonly level: number,
        public expanded: boolean,
        public selected: boolean,
        public highlighted: boolean,
        public firstChild: number,
        public nextSibling: number,
    ) {}

    /** Indicates whether the current node has children. */
    public get hasChildren(): boolean {
        return this.firstChild >= 0;
    }

    /** Indicates whether the current node is a leaf or a composite. */
    public abstract get isLeaf(): boolean;
}

/**
 * Represents a structure of elements as a tree.
 * @param TElement The base type of the structure elements.
 * @param TNode The concrete `TreeNode` type.
 */
export abstract class Tree<TElement, TNode extends TreeNode<TElement>> {
    public get nodes(): TNode[] {
        const nodes: TNode[] = [];
        for (const root of this.getContents().filter(node => node.level === 0)) {
            nodes.push(root);
            this.traverseNodes(root, nodes);
        }

        return nodes;
    }

    /** Gets or sets the current selected elements. */
    public get selectedElements(): TElement[] {
        return this.getContents()
            .filter(node => node.selected)
            .map(node => node.element);
    }
    public set selectedElements(elements: TElement[]) {
        const nodes = [...this.getContents()];
        const set = new Set(elements);
        for (let i = 0, n = nodes.length; i < n; i++) {
            const row = nodes[i];
            if (set.has(row.element)) {
                if (!row.selected) {
                    nodes[i] = this.clone(row, true);
                }
            } else if (row.selected) {
                nodes[i] = this.clone(row, false);
            }
        }

        this.setContents(nodes);
    }

    /**
     * Gets the children of the specified parent node.
     * @param node The current node (parent).
     * @returns An array containing the children.
     */
    public getChildren(node: TNode): TNode[] {
        const children: TNode[] = [];
        const nodes = this.getContents();
        if (node.firstChild >= 0) {
            let child = nodes[node.firstChild];
            children.push(child);
            while (child.nextSibling >= 0) {
                child = nodes[child.nextSibling];
                children.push(child);
            }
        }

        return children;
    }

    /**
     * Expands the node with the specified index.
     * @param index The index of the node to expand.
     */
    public expand(index: number): void;
    /**
     * Expands the specified node.
     * @param node The node to expand
     */
    public expand(node: TNode): void;
    /**
     * Expands the complete tree.
     */
    public expand(): void;
    public expand(arg?: number | TNode): void {
        const nodes = [...this.getContents()];
        if (nodes.length === 0) {
            return;
        }

        if (arg === undefined) {
            nodes.filter(node => !node.isLeaf && !node.expanded).forEach(node => this.expandNode(node, nodes));
        } else {
            const ancestors: TNode[] = [];
            let node = typeof arg === 'number' ? nodes[arg] : arg;
            if (!node.expanded) {
                this.expandNode(node, nodes);
            }

            let parentRow = node.parent >= 0 ? nodes[node.parent] : null;
            while (parentRow) {
                if (parentRow.expanded) {
                    break;
                }

                ancestors.push(parentRow);
                node = parentRow;
                parentRow = node.parent >= 0 ? nodes[node.parent] : null;
            }

            while (ancestors.length > 0) {
                const ancestor = ancestors.pop();
                if (!ancestor) {
                    break;
                }

                this.expandNode(ancestor, nodes);
            }
        }

        this.setContents(nodes);
    }

    /**
     * Collapses the specified node.
     * @param node The node to collapse.
     */
    public collapse(node?: TNode): void {
        let nodes: TNode[];
        if (node) {
            nodes = [...this.getContents()];
            const index = nodes.indexOf(node);
            const clone = this.cloneNode(node);
            clone.expanded = false;
            nodes[index] = clone;
        } else {
            nodes = this.getContents().map((node, index) => {
                if (index === 0) {
                    if (!node.expanded) {
                        const clone = this.cloneNode(node);
                        clone.expanded = true;
                        return clone;
                    }
                } else if (!node.isLeaf && node.expanded) {
                    const clone = this.cloneNode(node);
                    clone.expanded = false;
                    return clone;
                }

                return node;
            });
        }

        this.setContents(nodes);
    }

    /**
     * Toggels the selection state of the specified node.
     * - Press and hold the `ALT` key enables single selection mode.
     * - Press and hold the `SHIFT` key enables the area selection mode.
     * @param node The current node.
     * @param altKey The state of the `ALT` key.
     * @param shiftKey The state of the `SHIFT` key.
     */
    public toggleSelected(node: TNode, altKey: boolean, shiftKey: boolean): void {
        let nodes: TNode[];
        if (altKey) {
            nodes = this.getContents().map(item =>
                item === node ? this.clone(node, !node.selected) : item.selected ? this.clone(item, false) : item,
            );
        } else if (shiftKey) {
            const index = this.getContents().indexOf(node);
            let begin = index;
            let end = index;
            const selection = this.getContents().map(row => row.selected);
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

            nodes = this.getContents().map((node, i) => {
                if (i < begin || i > end) {
                    return node.selected ? this.clone(node, false) : node;
                } else {
                    return node.selected ? node : this.clone(node, true);
                }
            });
        } else {
            nodes = [...this.getContents()];
            const i = nodes.indexOf(node);
            nodes[i] = this.clone(node, !node.selected);
        }

        this.setContents(nodes);
    }

    /**
     * Toggles the selection state over all nodes:
     * - Selects all nodes if no node or some but not all nodes are selected.
     * - Deselects all nodes if all nodes are selected.
     */
    public toggleSelections(): void {
        const nodes = [...this.getContents()];
        if (nodes.length > 0) {
            const value = !nodes.every(row => row.selected);
            for (let index = 0, n = nodes.length; index < n; ++index) {
                const node = nodes[index];
                if (node.selected !== value) {
                    nodes[index] = this.clone(node, value);
                }
            }
        }

        this.setContents(nodes);
    }

    /**
     * Highlights the node with the specified index. Only one node in the tree can be highlighted at a time.
     * @param index The index of the node to highlight.
     */
    public highlight(index: number): void;
    /**
     * Highligts the specified node. Only one node in the tree can be highlighted at a time.
     * @param node The node to highlight.
     */
    public highlight(node: TNode): void;
    public highlight(arg: TNode | number): void {
        const index = typeof arg === 'number' ? arg : this.getContents().indexOf(arg);
        this.updateHighlighted(index);
    }

    protected abstract getContents(): TNode[];

    protected abstract setContents(nodes: TNode[]): void;

    protected abstract cloneNode(node: TNode): TNode;

    private expandNode(node: TNode, nodes: TNode[]) {
        const index = nodes.indexOf(node);
        const clone = this.cloneNode(node);
        clone.expanded = true;
        nodes[index] = clone;
    }

    private updateHighlighted(index: number): void {
        const nodes = [...this.getContents()];
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (i === index) {
                nodes[i] = this.cloneNode(node);
                nodes[i].highlighted = true;
            } else if (node.highlighted) {
                nodes[i] = this.cloneNode(node);
                nodes[i].highlighted = false;
            }
        }

        this.setContents(nodes);
    }

    private traverseNodes(node: TNode, expanded: TNode[]): void {
        const nodes = this.getContents();
        if (node.firstChild >= 0 && node.expanded) {
            let child = nodes[node.firstChild];
            expanded.push(child);
            this.traverseNodes(child, expanded);
            while (child.nextSibling >= 0) {
                child = nodes[child.nextSibling];
                expanded.push(child);
                this.traverseNodes(child, expanded);
            }
        }
    }

    private clone(node: TNode, selected: boolean): TNode {
        const clone = this.cloneNode(node);
        clone.selected = selected;
        return clone;
    }
}
