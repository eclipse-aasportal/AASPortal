/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument } from 'aas-core';
import { Tree, TreeNode } from '../tree';

export class AASTableRow extends TreeNode<AASDocument> {
    public constructor(
        document: AASDocument,
        parent: number,
        selected: boolean,
        expanded: boolean,
        highlighted: boolean,
        public readonly isLeaf: boolean,
        level: number,
        firstChild: number,
        nextSibling: number,
    ) {
        super(document, parent, level, expanded, selected, highlighted, firstChild, nextSibling);
    }

    public get trackId(): string {
        return this.element.endpoint + '.' + this.element.id;
    }

    public get id(): string {
        return this.element.id;
    }

    public get name(): string {
        return this.element.idShort;
    }

    public get thumbnail(): string {
        return this.element.thumbnail || '/assets/resources/aas.32.png';
    }

    public get endpoint(): string {
        return this.element.endpoint;
    }

    public get state(): 'loaded' | 'unloaded' | 'unavailable' {
        if (this.element.content === null) {
            return 'unloaded';
        }

        if (this.element.content) {
            return 'loaded';
        }

        return 'unavailable';
    }
}

export class AASTableTree extends Tree<AASDocument, AASTableRow> {
    private _nodes: AASTableRow[];

    public constructor(nodes: AASTableRow[]) {
        super();

        this._nodes = nodes;
    }

    public get nodes(): AASTableRow[] {
        return this._nodes;
    }

    protected override getNodes(): AASTableRow[] {
        return this._nodes;
    }

    protected override setNodes(nodes: AASTableRow[]): void {
        this._nodes = nodes;
    }

    protected override cloneNode(node: AASTableRow): AASTableRow {
        return new AASTableRow(
            node.element,
            node.parent,
            node.selected,
            node.expanded,
            node.highlighted,
            node.isLeaf,
            node.level,
            node.firstChild,
            node.nextSibling,
        );
    }
}
