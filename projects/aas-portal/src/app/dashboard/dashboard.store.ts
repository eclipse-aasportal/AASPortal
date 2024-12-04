/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { computed, Injectable, signal, untracked } from '@angular/core';
import { first, map, mergeMap, Observable, of, zip } from 'rxjs';
import { aas, LiveNode, LiveRequest } from 'aas-core';
import { AuthService } from 'aas-lib';
import { SelectionMode } from '../types/selection-mode';

export type DashboardColor = string;

export enum DashboardItemType {
    Chart = 'Chart',
    Grid = 'Grid',
}

export enum DashboardChartType {
    Line = 'Line',
    BarVertical = 'BarVertical',
    BarHorizontal = 'BarHorizontal',
    TimeSeries = 'TimeSeries',
}

export interface DashboardSource {
    label: string;
    color: DashboardColor;
    element: aas.Property | aas.Blob;
    node: LiveNode | null;
    url?: string;
}

export interface DashboardItemPosition {
    x: number;
    y: number;
}

export interface DashboardSelectable {
    selected: boolean;
    column: DashboardItem;
}

export interface DashboardItem {
    type: DashboardItemType;
    id: string;
    positions: DashboardItemPosition[];
}

export interface DashboardChart extends DashboardItem {
    label: string;
    type: DashboardItemType.Chart;
    chartType: DashboardChartType;
    sources: DashboardSource[];
    min?: number;
    max?: number;
}

export interface DashboardGrid extends DashboardItem {
    type: DashboardItemType.Grid;
    items: DashboardItem[];
}

export interface DashboardPage {
    name: string;
    items: DashboardItem[];
    requests: LiveRequest[];
}

export interface DashboardColumn {
    id: string;
    item: DashboardItem;
    itemType: DashboardItemType;
}

export interface DashboardRow {
    columns: DashboardColumn[];
}

export type DashboardState = {
    pages: DashboardPage[];
    index: number;
};

const initialState: DashboardState = {
    index: 0,
    pages: [{ name: 'Dashboard 1', items: [], requests: [] }],
};

@Injectable({
    providedIn: 'root',
})
export class DashboardStore {
    private readonly state$ = signal<DashboardState>(initialState);

    public constructor(private readonly auth: AuthService) {
        this.auth.ready
            .pipe(
                first(ready => ready === true),
                mergeMap(() =>
                    zip(this.auth.getCookie('.DashboardPage'), this.auth.getCookie('.DashboardPages')).pipe(
                        map(([value, data]) => {
                            if (data === undefined) {
                                return undefined;
                            }

                            const pages: DashboardPage[] = JSON.parse(data);
                            if (pages.length === 0) {
                                return undefined;
                            }

                            if (value === undefined) {
                                value = pages[0].name;
                            }

                            const index = Math.max(
                                pages.findIndex(page => page.name === value),
                                0,
                            );

                            return { pages, index } as DashboardState;
                        }),
                    ),
                ),
            )
            .subscribe(value => {
                if (value !== undefined) {
                    return this.state$.set(value);
                }
            });
    }

    public readonly pages$ = computed(() => this.state$().pages);

    public readonly index$ = computed(() => this.state$().index);

    public readonly activePage$ = computed(() => {
        const state = this.state$();
        return state.pages[state.index];
    });

    public rows$ = computed(() => {
        const state = this.state$();
        const page = state.pages[state.index];
        if (page === undefined) {
            return [];
        }

        return this.getGrid(page).map(rows => ({
            columns: rows.map(row => ({
                id: row.id,
                item: row,
                itemType: row.type,
            })),
        }));
    });

    public readonly modified$ = signal(false);

    public editMode$ = signal(false);

    public selectionMode$ = signal(SelectionMode.Single);

    public get memento(): DashboardState {
        return cloneDeep(untracked(this.state$));
    }

    public set memento(value: DashboardState) {
        this.state$.set(cloneDeep(value));
    }

    public setState(state: DashboardState): void {
        this.state$.set(state);
        this.modified$.set(true);
    }

    public updateState(updateFn: (state: DashboardState) => DashboardState): void {
        this.state$.update(updateFn);
        this.modified$.set(true);
    }

    public get pages(): DashboardPage[] {
        return untracked(this.state$).pages;
    }

    public get index(): number {
        return untracked(this.state$).index;
    }

    public get activePage(): DashboardPage {
        const state = untracked(this.state$);
        return state.pages[state.index];
    }

    public setActivePage(name: string): void {
        const index = this.pages.findIndex(page => page.name === name);
        if (this.index !== index) {
            this.updateState(state => ({ ...state, index }));
        }
    }

    public update(page: DashboardPage): void {
        const pages = [...this.pages];
        const index = pages.findIndex(item => item.name === page.name);
        pages[index] = page;
        this.state$.update(state => ({ ...state, pages }));
        this.modified$.set(true);
    }

    public getPage(name: string): DashboardPage | undefined {
        return this.pages.find(page => page.name === name);
    }

    public canMoveDown(page: DashboardPage, item: DashboardItem): boolean {
        const grid = this.getGrid(page);
        const y = item.positions[0].y;
        if (y < grid.length - 1) {
            if (grid[y + 1].length < 12) {
                return true;
            }
        } else if (grid[y].length > 1) {
            return true;
        }

        return false;
    }

    public canMoveLeft(page: DashboardPage, item: DashboardItem): boolean {
        return item.positions[0].x > 0;
    }

    public canMoveRight(page: DashboardPage, item: DashboardItem): boolean {
        const row = this.getRow(page, item);
        return item.positions[0].x < row.length - 1;
    }

    public canMoveUp(page: DashboardPage, item: DashboardItem): boolean {
        const grid = this.getGrid(page);
        const y = item.positions[0].y;
        if (y > 0) {
            if (grid[y - 1].length < 12) {
                return true;
            }
        } else if (grid[y].length > 1) {
            return true;
        }

        return false;
    }

    public save(): Observable<void> {
        return this.saveCurrentPage().pipe(
            mergeMap(() => {
                if (this.modified$()) {
                    this.modified$.set(false);
                    return this.savePages();
                }

                return of(void 0);
            }),
        );
    }

    public createPageName(pages?: DashboardPage[]): string {
        pages = pages || this.state$().pages;
        let name = '';
        for (let i = 1; i < Number.MAX_SAFE_INTEGER; i++) {
            name = 'Dashboard ' + i;
            if (!pages.find(page => page.name === name)) {
                return name;
            }
        }

        throw new Error('Unable to create unique name.');
    }

    public getGrid(page: DashboardPage): DashboardItem[][] {
        const map = new Map<number, DashboardItem[]>();
        page.items.forEach(item => {
            const y = item.positions[0].y;
            let row = map.get(y);
            if (!row) {
                row = [];
                map.set(y, row);
            }

            row.push(item);
        });

        const grid: DashboardItem[][] = [];
        let y = 0;
        for (let i = 0; i < map.size; ) {
            const row = map.get(y);
            if (row) {
                row.sort((a, b) => a.positions[0].x - b.positions[0].x);
                grid.push(row);
                ++i;
            }

            ++y;
        }

        return grid;
    }

    private getRow(page: DashboardPage, item: DashboardItem): DashboardItem[] {
        const y = item.positions[0].y;
        const row = page.items.filter(item => item.positions[0].y === y);
        row.sort((a, b) => a.positions[0].x - b.positions[0].x);
        return row;
    }

    private saveCurrentPage(): Observable<void> {
        const state = untracked(this.state$);
        return this.auth.setCookie('.DashboardPage', state.pages[state.index].name);
    }

    private savePages(): Observable<void> {
        const pages = untracked(this.state$).pages;
        if (pages.length > 0) {
            return this.auth.setCookie('.DashboardPages', JSON.stringify(pages));
        }

        return this.auth.deleteCookie('.DashboardPages');
    }
}
