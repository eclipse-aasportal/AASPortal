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

@Injectable()
export class AASTableEffects {
    private readonly store: Store<AASTableFeatureState>;

    constructor(
        private readonly actions: Actions,
        store: Store,
    ) {
        this.store = store as Store<AASTableFeatureState>;
    }

    public updateListView = createEffect(() => {
        return this.actions.pipe(
            ofType<AASTableActions.UpdateListViewAction>(AASTableActions.AASTableActionType.UPDATE_LIST_VIEW),
            exhaustMap(action => this.store.select(AASTableSelectors.selectRows).pipe(
                first(),
                map(state => {
                    const rows = this.bla(state, action.documents);
                    return AASTableActions.setRows({ rows });
                })
            )));
    });

    public updateTreeView = createEffect(() => {
        return this.actions.pipe(
            ofType<AASTableActions.UpdateTreeViewAction>(AASTableActions.AASTableActionType.UPDATE_TREE_VIEW),
            exhaustMap(action => this.store.select(AASTableSelectors.selectRows).pipe(
                first(),
                map(state => {
                    const rows = this.wupp(state, action.documents);
                    return AASTableActions.setRows({ rows });
                })
            )));
    });

    private bla(state: AASTableRow[], documents: AASDocument[]): AASTableRow[] {
        const map = new Map(state.map(row => [`${row.endpoint}:${row.id}`, row]));
        const rows = documents.map(document => {
            return map.get(`${document.endpoint}:${document.id}`) ?? new AASTableRow(document, false, false, false, -1, -1, -1);
        });

        return rows;
    }
    
    private wupp(state: AASTableRow[], documents: AASDocument[]): AASTableRow[] {
        const map = new Map(state.map(item => [`${item.endpoint}:${item.id}`, item]));
        const rows: AASTableRow[] = [];
        const nodes: AASDocument[] = [];
        documents.forEach(document => {
            const row = map.get(`${document.endpoint}:${document.id}`);
            if (row) {
                rows.push(row);
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
                rows.length + 1,
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
            row.nextSibling)
    }
}
