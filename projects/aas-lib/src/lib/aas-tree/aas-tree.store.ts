/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, Injectable, signal, untracked } from '@angular/core';
import { aas, AASDocument } from 'aas-core';
import { AASTree, AASTreeRow } from './aas-tree-row';

type AASTreeState = {
    expanded: boolean;
    matchIndex: number;
    rows: AASTreeRow[];
    nodes: AASTreeRow[];
};

const initialState: AASTreeState = {
    expanded: false,
    matchIndex: 0,
    rows: [],
    nodes: [],
};

@Injectable({
    providedIn: 'root',
})
export class AASTreeStore {
    public readonly state$ = signal<AASTreeState>(initialState);

    public readonly selectedRows$ = computed(() => this.state$().rows.filter(row => row.selected));

    public readonly selectedElements$ = computed(() =>
        this.state$()
            .rows.filter(row => row.selected)
            .map(item => item.element),
    );

    public get rows(): AASTreeRow[] {
        return untracked(this.state$).rows;
    }

    public document: AASDocument | null = null;

    public shiftKey = false;

    public altKey = false;

    public setMatchIndex(matchIndex: number): void {
        this.state$.update(state => {
            const tree = new AASTree(state.rows);
            tree.highlight(matchIndex);
            return {
                ...state,
                matchIndex: matchIndex,
                rows: tree.nodes,
                nodes: tree.expanded,
            };
        });
    }

    public highlight(node: AASTreeRow): void {
        this.state$.update(state => {
            const tree = new AASTree(state.rows);
            tree.highlight(node);
            return {
                ...state,
                rows: tree.nodes,
                nodes: tree.expanded,
            };
        });
    }

    public toggleSelected(row: AASTreeRow, altKey: boolean, shiftKey: boolean): void {
        this.state$.update(state => {
            const tree = new AASTree(state.rows);
            tree.toggleSelected(row, altKey, shiftKey);
            return {
                ...state,
                rows: tree.nodes,
                nodes: tree.expanded,
            };
        });
    }

    public toggleSelections(): void {
        this.state$.update(state => {
            const tree = new AASTree(state.rows);
            tree.toggleSelections();
            return {
                ...state,
                rows: tree.nodes,
                nodes: tree.expanded,
            };
        });
    }

    public collapse(): void {
        this.state$.update(state => {
            const tree = new AASTree(state.rows);
            tree.collapse();
            return {
                ...state,
                rows: tree.nodes,
                nodes: tree.expanded,
            };
        });
    }

    public expand(): void {
        this.state$.update(state => {
            const tree = new AASTree(state.rows);
            tree.expand();
            return {
                ...state,
                rows: tree.nodes,
                nodes: tree.expanded,
            };
        });
    }

    public collapseRow(row: AASTreeRow): void {
        this.state$.update(state => {
            const tree = new AASTree(state.rows);
            tree.collapse(row);
            return {
                ...state,
                rows: tree.nodes,
                nodes: tree.expanded,
            };
        });
    }

    public expandRow(arg: AASTreeRow | number): void {
        this.state$.update(state => {
            const tree = new AASTree(state.rows);
            tree.expand(arg);
            return {
                ...state,
                rows: tree.nodes,
                nodes: tree.expanded,
            };
        });
    }

    public setSelectedElements(elements: aas.Referable[]): void {
        this.state$.update(state => {
            const tree = new AASTree(state.rows);
            tree.selectedElements = elements;
            return {
                ...state,
                rows: tree.nodes,
                nodes: tree.expanded,
            };
        });
    }

    public update(blob: aas.Blob, value: string): void {
        this.state$.update(state => {
            blob.value = value;
            const tree = new AASTree(state.rows);
            tree.update(blob);
            return { ...state, rows: tree.nodes, nodes: tree.expanded };
        });
    }
}
