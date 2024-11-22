/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

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

    public get hasChildren(): boolean {
        return this.firstChild >= 0;
    }

    public abstract get isLeaf(): boolean;
}

export abstract class Tree<TElement, TNode extends TreeNode<TElement>> {
    public get expanded(): TNode[] {
        const nodes: TNode[] = [];
        for (const root of this.getNodes().filter(node => node.level === 0)) {
            nodes.push(root);
            this.traverseNodes(root, nodes);
        }

        return nodes;
    }

    public get selectedElements(): TElement[] {
        return this.getNodes()
            .filter(node => node.selected)
            .map(node => node.element);
    }

    public set selectedElements(elements: TElement[]) {
        const nodes = [...this.getNodes()];
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

        this.setNodes(nodes);
    }

    public getChildren(node: TNode): TNode[] {
        const children: TNode[] = [];
        const nodes = this.getNodes();
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

    public get highlighted(): TNode[] {
        return [];
    }

    public expand(arg?: number | TNode): void {
        const nodes = [...this.getNodes()];
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

        this.setNodes(nodes);
    }

    public collapse(node?: TNode): void {
        let nodes: TNode[];
        if (node) {
            nodes = [...this.getNodes()];
            const index = nodes.indexOf(node);
            const clone = this.cloneNode(node);
            clone.expanded = false;
            nodes[index] = clone;
        } else {
            nodes = this.getNodes().map((node, index) => {
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

        this.setNodes(nodes);
    }

    public toggleSelected(node: TNode, altKey: boolean, shiftKey: boolean): void {
        let nodes: TNode[];
        if (altKey) {
            nodes = this.getNodes().map(item =>
                item === node ? this.clone(node, !node.selected) : item.selected ? this.clone(item, false) : item,
            );
        } else if (shiftKey) {
            const index = this.getNodes().indexOf(node);
            let begin = index;
            let end = index;
            const selection = this.getNodes().map(row => row.selected);
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

            nodes = this.getNodes().map((node, i) => {
                if (i < begin || i > end) {
                    return node.selected ? this.clone(node, false) : node;
                } else {
                    return node.selected ? node : this.clone(node, true);
                }
            });
        } else {
            nodes = [...this.getNodes()];
            const i = nodes.indexOf(node);
            nodes[i] = this.clone(node, !node.selected);
        }

        this.setNodes(nodes);
    }

    public toggleSelections(): void {
        const nodes = [...this.getNodes()];
        if (nodes.length > 0) {
            const value = !nodes.every(row => row.selected);
            for (let index = 0, n = nodes.length; index < n; ++index) {
                const node = nodes[index];
                if (node.selected !== value) {
                    nodes[index] = this.clone(node, value);
                }
            }
        }

        this.setNodes(nodes);
    }

    public highlight(arg: TNode | number): void {
        const index = typeof arg === 'number' ? arg : this.getNodes().indexOf(arg);
        this.updateHighlighted(index);
    }

    protected abstract getNodes(): TNode[];

    protected abstract setNodes(nodes: TNode[]): void;

    protected abstract cloneNode(node: TNode): TNode;

    private expandNode(node: TNode, nodes: TNode[]) {
        const index = nodes.indexOf(node);
        const clone = this.cloneNode(node);
        clone.expanded = true;
        nodes[index] = clone;
    }

    private updateHighlighted(index: number): void {
        const nodes = [...this.getNodes()];
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

        this.setNodes(nodes);
    }

    private traverseNodes(node: TNode, expanded: TNode[]): void {
        const nodes = this.getNodes();
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
