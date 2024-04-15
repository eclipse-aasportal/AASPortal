/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { exhaustMap, map, first } from 'rxjs';
import { findLastIndex } from 'lodash-es';
import { AASDocument } from 'common';

import * as AASTableActions from './aas-table.actions';
import * as AASTableSelectors from './aas-table.selectors';
import { AASTableFeatureState, AASTableRow } from './aas-table.state';
import { ViewMode } from '../types/view-mode';

@Injectable()
export class AASTableEffects {
    private readonly store: Store<AASTableFeatureState>;

    public constructor(
        private readonly actions: Actions,
        store: Store,
    ) {
        this.store = store as Store<AASTableFeatureState>;
    }

    public updateView = createEffect(() => {
        return this.actions.pipe(
            ofType<AASTableActions.UpdateViewAction>(AASTableActions.AASTableActionType.UPDATE_VIEW),
            exhaustMap(action =>
                this.store.select(AASTableSelectors.selectState).pipe(
                    first(),
                    map(state => {
                        const rows =
                            state.viewMode === ViewMode.List
                                ? this.createListViewRows(state.rows, action.documents)
                                : this.createTreeViewRows(state.rows, action.documents);

                        return AASTableActions.setRows({ rows });
                    }),
                ),
            ),
        );
    });

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
