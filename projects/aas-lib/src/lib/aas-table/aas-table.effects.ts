/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
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

    constructor(
        private readonly actions: Actions,
        store: Store,
    ) {
        this.store = store as Store<AASTableFeatureState>;
    }

    public updateView = createEffect(() => {
        return this.actions.pipe(
            ofType<AASTableActions.UpdateViewAction>(AASTableActions.AASTableActionType.UPDATE_VIEW),
            exhaustMap(action => this.store.select(AASTableSelectors.selectState).pipe(
                first(),
                map(state => {
                    const rows = state.viewMode === ViewMode.List
                        ? this.createListViewRows(state.rows, action.documents)
                        : this.createTreeViewRows(state.rows, action.documents);

                    return AASTableActions.setRows({ rows });
                })
            )));
    });

    private createListViewRows(state: AASTableRow[], documents: AASDocument[]): AASTableRow[] {
        const map = new Map(state.map(row => [`${row.endpoint}:${row.id}`, row]));
        const rows = documents.map(document => {
            const row =  map.get(`${document.endpoint}:${document.id}`);
            if (row) {
                return row.document === document ? row : this.cloneD(row, document)
            }

            return new AASTableRow(document, false, false, false, -1, -1, -1);
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
                rows.push(row.document === document ? row : this.cloneD(row, document));
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
        const root = nodes.find(node => node.parent === null);
        const index = findLastIndex(rows, row => row.level === 0);
        if (root) {
            const children = nodes.filter(node => this.isChild(root, node));
            const rootRow = new AASTableRow(
                root,
                false,
                false,
                children.length === 0,
                0,
                children.length > 0 ? rows.length + 1 : -1,
                -1
            );

            rows.push(rootRow)

            if (index >= 0) {
                const previous = this.clone(rows[index]);
                previous.nextSibling = rows.length - 1;
                rows[index] = previous;
            }

            this.traverse(root, nodes, rows, 1);
        }

        return rows;
    }

    private traverse(parent: AASDocument, nodes: AASDocument[], rows: AASTableRow[], level: number): void {
        let previous: AASTableRow | null = null;
        const children = nodes.filter(node => this.isChild(parent, node));
        for (const child of children) {
            const row = new AASTableRow(
                child,
                false,
                false,
                children.length === 0,
                level,
                -1,
                -1
            );

            rows.push(row);
            if (previous) {
                previous.nextSibling = rows.length - 1;
            }

            if (children.length > 0) {
                row.firstChild = rows.length;
                this.traverse(child, nodes, rows, level + 1);
            }

            previous = row;
        }
    }

    private isChild(parent: AASDocument, node: AASDocument): boolean {
        if (!node.parent) {
            return false;
        }

        return node.parent.endpoint === parent.endpoint && node.parent.id === parent.id;
    }

    private clone(row: AASTableRow): AASTableRow {
        return new AASTableRow(
            row.document,
            row.selected,
            row.expanded,
            row.isLeaf,
            row.level,
            row.firstChild,
            row.nextSibling);
    }


    private cloneD(row: AASTableRow, document: AASDocument): AASTableRow {
        return new AASTableRow(
            document,
            row.selected,
            row.expanded,
            row.isLeaf,
            row.level,
            row.firstChild,
            row.nextSibling);
    }

}
