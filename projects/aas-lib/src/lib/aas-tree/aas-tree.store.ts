/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, computed, signal } from '@angular/core';
import { AASTree, AASTreeRow } from './aas-tree-row';
import { AASDocument, aas } from 'common';
import { TranslateService } from '@ngx-translate/core';
import { NotifyService } from '../notify/notify.service';

export type Operator = '=' | '<' | '>' | '<=' | '>=' | '!=';

export interface SearchQuery {
    modelType: aas.ModelType;
    operator?: Operator;
    name?: string;
    value?: string | boolean;
}

export interface SearchTerm {
    text?: string;
    query?: SearchQuery;
}

interface AASTreeState {
    matchIndex: number;
    rows: AASTreeRow[];
    nodes: AASTreeRow[];
}

@Injectable()
export class AASTreeStore {
    private readonly _state = signal<AASTreeState>({ matchIndex: -1, rows: [], nodes: [] });

    public constructor(
        private readonly notify: NotifyService,
        private readonly translate: TranslateService,
    ) {}

    public readonly state = this._state.asReadonly();

    public readonly rows = computed(() => this._state().rows);

    public readonly matchIndex = computed(() => this._state().matchIndex);

    public readonly nodes = computed(() => this._state().nodes);

    public readonly selectedRows = computed(() => this._state().rows.filter(row => row.selected));

    public readonly selectedElements = computed(() =>
        this._state()
            .rows.filter(row => row.selected)
            .map(item => item.element),
    );

    public readonly matchRow = computed(() => {
        const state = this._state();
        return state.matchIndex >= 0 ? state.rows[state.matchIndex] : undefined;
    });

    public toggleSelected(row: AASTreeRow, altKey: boolean, shiftKey: boolean): void {
        const tree = new AASTree(this._state().rows);
        tree.toggleSelected(row, altKey, shiftKey);
        this._state.update(state => ({
            ...state,
            rows: tree.nodes,
            nodes: tree.expanded,
        }));
    }

    public toggleSelections(): void {
        const tree = new AASTree(this._state().rows);
        tree.toggleSelections();
        this._state.update(state => ({
            ...state,
            rows: tree.nodes,
            nodes: tree.expanded,
        }));
    }

    public collapse(): void {
        const tree = new AASTree(this._state().rows);
        tree.collapse();
        this._state.update(state => ({
            ...state,
            rows: tree.nodes,
            nodes: tree.expanded,
        }));
    }

    public collapseRow(row: AASTreeRow): void {
        const tree = new AASTree(this._state().rows);
        tree.collapse(row);
        this._state.update(state => ({
            ...state,
            rows: tree.nodes,
            nodes: tree.expanded,
        }));
    }

    public expandRow(arg: AASTreeRow | number): void {
        const tree = new AASTree(this._state().rows);
        tree.expand(arg);
        this._state.update(state => ({
            ...state,
            rows: tree.nodes,
            nodes: tree.expanded,
        }));
    }

    public updateRows(document: AASDocument | null): void {
        try {
            if (document) {
                const tree = AASTree.from(document, this.translate.currentLang);
                this._state.set({
                    matchIndex: -1,
                    rows: tree.nodes,
                    nodes: tree.expanded,
                });
            } else {
                this._state.set({
                    matchIndex: -1,
                    rows: [],
                    nodes: [],
                });
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public setSelectedElements(elements: aas.Referable[]): void {
        const tree = new AASTree(this._state().rows);
        tree.selectedElements = elements;
        this._state.update(state => ({
            ...state,
            rows: tree.nodes,
            nodes: tree.expanded,
        }));
    }

    public setMatchIndex(matchIndex: number): void {
        const tree = new AASTree(this._state().rows);
        tree.highlight(matchIndex);
        this._state.set({
            matchIndex: matchIndex,
            rows: tree.nodes,
            nodes: tree.expanded,
        });
    }
}
