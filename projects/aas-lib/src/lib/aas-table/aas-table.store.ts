/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal, untracked } from '@angular/core';
import findLastIndex from 'lodash-es/findLastIndex';
import { AASDocument } from 'aas-core';
import { ViewMode } from '../types';
import { AASTableRow, AASTableTree } from './aas-table-row';

type AASTableState = {
    documents: AASDocument[];
    totalRows: AASTableRow[];
    rows: AASTableRow[];
};

const initialState: AASTableState = {
    documents: [],
    totalRows: [],
    rows: [],
};

@Injectable()
export class AASTableStore {
    private readonly _totalRows = signal<AASTableRow[]>(initialState.totalRows);
    private readonly _rows = signal<AASTableRow[]>(initialState.rows);

    public readonly rows = this._rows.asReadonly();

    public readonly documents = signal<AASDocument[]>(initialState.documents);

    public setSelected(documents: AASDocument[], viewMode: ViewMode): void {
        const tree = new AASTableTree(untracked(this._totalRows));
        tree.selectedElements = documents;
        this._totalRows.set(tree.nodes);
        if (viewMode === ViewMode.List) {
            this._rows.set(tree.nodes);
        } else {
            this._rows.set(tree.expanded);
        }
    }

    public toggleSelected(row: AASTableRow, altKey: boolean, shiftKey: boolean, viewMode: ViewMode): AASDocument[] {
        const tree = new AASTableTree(this._totalRows());
        tree.toggleSelected(row, altKey, shiftKey);
        this._totalRows.set(tree.nodes);
        if (viewMode === ViewMode.List) {
            this._rows.set(tree.nodes);
        } else {
            this._rows.set(tree.expanded);
        }

        return this._totalRows()
            .filter(row => row.selected)
            .map(row => row.element);
    }

    public toggleSelections(viewMode: ViewMode): AASDocument[] {
        const tree = new AASTableTree(this._totalRows());
        tree.toggleSelections();
        this._totalRows.set(tree.nodes);
        if (viewMode === ViewMode.List) {
            this._rows.set(tree.nodes);
        } else {
            this._rows.set(tree.expanded);
        }

        return this._totalRows()
            .filter(row => row.selected)
            .map(row => row.element);
    }

    public expandRow(row: AASTableRow): void {
        const tree = new AASTableTree(this._totalRows());
        tree.expand(row);
        this._rows.set(tree.expanded);
    }

    public collapseRow(row: AASTableRow): void {
        const tree = new AASTableTree(this._totalRows());
        tree.collapse(row);
        this._rows.set(tree.expanded);
    }

    public initialize(documents: AASDocument[], viewMode: ViewMode): void {
        const state = untracked(this._totalRows);
        const totalRows =
            viewMode === ViewMode.List
                ? this.createListViewRows(state, documents)
                : this.createTreeViewRows(state, documents);

        this._totalRows.set(totalRows);

        if (viewMode === ViewMode.List) {
            this._rows.set(totalRows);
        } else {
            this._rows.set(new AASTableTree(totalRows).expanded);
        }
    }

    private createListViewRows(state: AASTableRow[], documents: AASDocument[]): AASTableRow[] {
        const map = new Map(state.map(row => [`${row.endpoint}:${row.id}`, row]));
        const rows = documents.map(document => {
            const row = map.get(`${document.endpoint}:${document.id}`);
            if (row) {
                return row.element === document ? row : this.cloneWithNewDocument(row, document);
            }

            return new AASTableRow(document, -1, false, false, false, false, -1, -1, -1);
        });

        return rows;
    }

    private createTreeViewRows(state: AASTableRow[], documents: AASDocument[]): AASTableRow[] {
        const map = new Map(state.map(row => [`${row.endpoint}:${row.id}`, row]));
        const rows: AASTableRow[] = [];
        const nodes: AASDocument[] = [];
        documents.forEach(document => {
            const row = map.get(`${document.endpoint}:${document.id}`);
            if (row) {
                rows.push(row.element === document ? row : this.cloneWithNewDocument(row, document));
            } else {
                nodes.push(document);
            }
        });

        if (nodes.length > 0) {
            this.addRoot(nodes, rows);
        }

        return rows;
    }

    private addRoot(nodes: AASDocument[], rows: AASTableRow[]): AASTableRow[] {
        const root = nodes.find(node => !node.parentId);
        const index = findLastIndex(rows, row => row.level === 0);
        if (root) {
            const hasChildren = this.hasChildren(root, nodes);
            const rootRow = new AASTableRow(
                root,
                -1,
                false,
                false,
                false,
                !hasChildren,
                0,
                hasChildren ? rows.length + 1 : -1,
                -1,
            );

            const parentIndex = rows.length;
            rows.push(rootRow);

            if (index >= 0) {
                const previous = this.clone(rows[index]);
                previous.nextSibling = rows.length - 1;
                rows[index] = previous;
            }

            this.traverse(root, nodes, rows, parentIndex, 1);
        }

        return rows;
    }

    private traverse(
        parent: AASDocument,
        nodes: AASDocument[],
        rows: AASTableRow[],
        parentIndex: number,
        level: number,
    ): void {
        let previous: AASTableRow | null = null;
        for (const child of this.getChildren(parent, nodes)) {
            const row = new AASTableRow(
                child,
                parentIndex,
                false,
                false,
                false,
                !this.hasChildren(child, nodes),
                level,
                -1,
                -1,
            );

            const index = rows.length;
            rows.push(row);
            if (previous) {
                previous.nextSibling = index;
            }

            row.firstChild = rows.length;
            this.traverse(child, nodes, rows, index, level + 1);
            previous = row;
        }
    }

    private getChildren(parent: AASDocument, nodes: AASDocument[]): AASDocument[] {
        const children: AASDocument[] = [];
        for (const node of nodes) {
            if (node.parentId === parent.id) {
                children.push(node);
            }
        }

        return children;
    }

    private hasChildren(parent: AASDocument, nodes: AASDocument[]): boolean {
        for (const node of nodes) {
            if (node.parentId === parent.id) {
                return true;
            }
        }

        return false;
    }

    private clone(row: AASTableRow): AASTableRow {
        return new AASTableRow(
            row.element,
            row.parent,
            row.selected,
            row.expanded,
            row.highlighted,
            row.isLeaf,
            row.level,
            row.firstChild,
            row.nextSibling,
        );
    }

    private cloneWithNewDocument(row: AASTableRow, document: AASDocument): AASTableRow {
        return new AASTableRow(
            document,
            row.parent,
            row.selected,
            row.expanded,
            row.highlighted,
            row.isLeaf,
            row.level,
            row.firstChild,
            row.nextSibling,
        );
    }
}
