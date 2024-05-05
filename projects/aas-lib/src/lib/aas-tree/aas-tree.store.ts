/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { AASTree, AASTreeRow } from './aas-tree-row';
import { AASDocument, aas } from 'common';
import { BehaviorSubject, Subject, map } from 'rxjs';
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

@Injectable()
export class AASTreeStore {
    private readonly terms$ = new BehaviorSubject<SearchTerm[]>([]);
    private readonly index$ = new BehaviorSubject(-1);
    private readonly selectedElements = new Subject<aas.Referable[]>();
    private _rows: AASTreeRow[] = [];
    private _nodes: AASTreeRow[] = [];

    public constructor(
        private readonly notify: NotifyService,
        private readonly translate: TranslateService,
    ) {}

    public get rows(): AASTreeRow[] {
        return this._rows;
    }

    public get terms(): SearchTerm[] {
        return this.terms$.getValue();
    }

    public get index(): number {
        return this.index$.getValue();
    }

    public get nodes(): AASTreeRow[] {
        return this._nodes;
    }

    public readonly selectTerms = this.terms$.asObservable();

    public get selectSelectedRows(): AASTreeRow[] {
        return this._rows.filter(row => row.selected);
    }

    public readonly selectSelectedElements = this.selectedElements.asObservable();

    public readonly selectMatchIndex = this.index$.asObservable();

    public readonly selectMatchRow = this.index$
        .asObservable()
        .pipe(map(index => (index >= 0 ? this._rows[index] : undefined)));

    public toggleSelected(row: AASTreeRow, altKey: boolean, shiftKey: boolean): void {
        const tree = new AASTree(this._rows);
        tree.toggleSelected(row, altKey, shiftKey);
        this._rows = tree.nodes;
        this._nodes = tree.expanded;
        this.selectedElements.next(this._rows.filter(row => row.selected).map(item => item.element));
    }

    public toggleSelections(): void {
        const tree = new AASTree(this._rows);
        tree.toggleSelections();
        this._rows = tree.nodes;
        this._nodes = tree.expanded;
        this.selectedElements.next(this._rows.filter(row => row.selected).map(item => item.element));
    }

    public collapse(): void {
        const tree = new AASTree(this._rows);
        tree.collapse();
        this._rows = tree.nodes;
        this._nodes = tree.expanded;
    }

    public collapseRow(row: AASTreeRow): void {
        const tree = new AASTree(this._rows);
        tree.collapse(row);
        this._rows = tree.nodes;
        this._nodes = tree.expanded;
    }

    public expandRow(arg: AASTreeRow | number): void {
        const tree = new AASTree(this._rows);
        tree.expand(arg);
        this._rows = tree.nodes;
        this._nodes = tree.expanded;
    }

    public updateRows(document: AASDocument | null): void {
        try {
            if (document) {
                const tree = AASTree.from(document, this.translate.currentLang);
                this._rows = tree.nodes;
                this._nodes = tree.expanded;
            } else {
                this._rows = [];
                this._nodes = [];
            }

            this.index$.next(-1);
            this.selectedElements.next([]);
        } catch (error) {
            this.notify.error(error);
        }
    }

    public setSelectedElements(elements: aas.Referable[]): void {
        const tree = new AASTree(this._rows);
        tree.selectedElements = elements;
        this._rows = tree.nodes;
        this._nodes = tree.expanded;
        this.selectedElements.next(this._rows.filter(row => row.selected).map(item => item.element));
    }

    public setSearchText(terms: SearchTerm[]): void {
        this.terms$.next(terms);
    }

    public setMatchIndex(index: number): void {
        const tree = new AASTree(this._rows);
        tree.highlight(index);
        this._rows = tree.nodes;
        this._nodes = tree.expanded;
        this.index$.next(index);
    }
}
