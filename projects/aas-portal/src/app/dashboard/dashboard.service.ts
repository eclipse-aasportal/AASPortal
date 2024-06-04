/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash-es/cloneDeep';
import { BehaviorSubject, EMPTY, first, map, mergeMap, Observable, of } from 'rxjs';
import { encodeBase64Url, AuthService } from 'aas-lib';
import { aas, AASDocument, ApplicationError, getIdShortPath, getUnit, LiveNode, LiveRequest } from 'common';

import { ERRORS } from '../types/errors';
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

export interface DashboardState {
    pages: DashboardPage[];
    index: number;
}

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    private readonly index$ = new BehaviorSubject(0);
    private _pages: DashboardPage[] = [{ name: this.createPageName(), items: [], requests: [] }];
    private _editMode = false;
    private _selectionMode: SelectionMode = SelectionMode.Single;
    private modified = false;

    public constructor(private auth: AuthService) {
        this.auth.ready
            .pipe(
                first(ready => ready === true),
                mergeMap(() =>
                    this.auth.getCookie('.DashboardPage').pipe(
                        map(value =>
                            this.auth.getCookie('.DashboardPages').pipe(
                                mergeMap(data => (data ? of(JSON.parse(data) as DashboardPage[]) : EMPTY)),
                                map(pages => {
                                    this._pages = pages;
                                    this.index$.next(
                                        Math.max(
                                            pages.findIndex(page => page.name === value),
                                            0,
                                        ),
                                    );
                                }),
                            ),
                        ),
                    ),
                ),
            )
            .subscribe();
    }

    public readonly activePage: Observable<DashboardPage> = this.index$
        .asObservable()
        .pipe(map(index => this._pages[index]));

    public get pages(): DashboardPage[] {
        return this._pages;
    }

    public get editMode(): boolean {
        return this._editMode;
    }

    public set editMode(value: boolean) {
        this._editMode = value;
    }

    public get selectionMode(): SelectionMode {
        return this._selectionMode;
    }

    public set selectionMode(value: SelectionMode) {
        this._selectionMode = value;
    }

    public get state(): DashboardState {
        return { pages: this._pages, index: this.index$.getValue() };
    }

    public set state(value: DashboardState) {
        this._pages = value.pages;
        this.index$.next(value.index);
    }

    public getPage(name: string): DashboardPage | undefined {
        return this._pages.find(item => item.name === name);
    }

    public setPage(arg: string | DashboardPage): void {
        const index =
            typeof arg === 'string' ? this._pages.findIndex(page => page.name === arg) : this._pages.indexOf(arg);

        if (index < 0) {
            throw new Error('Invalid operation.');
        }

        this.index$.next(index);
    }

    public add(
        page: DashboardPage,
        document: AASDocument,
        elements: aas.SubmodelElement[],
        chartType: DashboardChartType,
    ): void {
        page = cloneDeep(page);
        const properties = elements.filter(item => item.modelType === 'Property').map(item => item as aas.Property);

        const blobs = elements.filter(item => item.modelType === 'Blob').map(item => item as aas.Blob);

        const nodes = this.getNodes(page, document);
        if (properties.length > 0) {
            switch (chartType) {
                case DashboardChartType.Line:
                    this.addLineCharts(page, document.content!, properties, nodes);
                    break;
                case DashboardChartType.BarVertical:
                    this.addBarChart(page, properties, nodes);
                    break;
                default:
                    throw new Error(`Not implemented`);
            }

            this.modified = true;
        }

        if (blobs.length > 0) {
            this.addScatterChart(document, page, blobs);
            this.modified = true;
        }

        if (this.modified) {
            this.updatePage(page);
        }
    }

    public addNew(name?: string): void {
        name = name?.trim();
        if (!name && this._pages.some(item => item.name === name)) {
            throw new ApplicationError(
                `A page withe name "${name}" already exists.`,
                ERRORS.DASHBOARD_PAGE_ALREADY_EXISTS,
                name,
            );
        }

        this.addNewPage(name);
        this.modified = true;
    }

    public rename(page: DashboardPage, name: string) {
        name = name?.trim();
        if (!name) {
            throw new Error('Valid page name expected.');
        }

        if (this._pages.some(item => item.name === name)) {
            throw new ApplicationError(
                `A page withe name "${name}" already exists.`,
                ERRORS.DASHBOARD_PAGE_ALREADY_EXISTS,
                name,
            );
        }

        this.renamePage(page, name);
        this.modified = true;
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

    public update(page: DashboardPage): void {
        this.updatePage(page);
        this.modified = true;
    }

    public delete(page: DashboardPage): void {
        this.deletePage(page);
        this.modified = true;
    }

    public save(): Observable<void> {
        return this.saveCurrentPage().pipe(
            mergeMap(() => {
                if (this.modified) {
                    this.modified = false;
                    return this.savePages();
                }

                return of(void 0);
            }),
        );
    }

    private addLineCharts(
        page: DashboardPage,
        env: aas.Environment,
        properties: aas.Property[],
        nodes: LiveNode[] | null,
    ): void {
        let columnIndex = 0;
        let rowIndex = page.items.length > 0 ? Math.max(...page.items.map(item => item.positions[0].y)) + 1 : 0;
        for (const property of properties) {
            let node: LiveNode | null = null;
            if (nodes != null && property.nodeId && !this.containsNode(nodes, property.nodeId)) {
                node = { nodeId: property.nodeId, valueType: property.valueType ?? 'undefined' };
                nodes.push(node);
            }

            let label = property.idShort;
            const unit = getUnit(env, property);
            if (unit) {
                label += ' ' + unit;
            }

            const item: DashboardChart = {
                label: label,
                id: uuid(),
                type: DashboardItemType.Chart,
                chartType: DashboardChartType.Line,
                positions: [{ x: columnIndex, y: rowIndex }],
                sources: [
                    {
                        label: property.idShort,
                        color: this.createRandomColor(),
                        element: property,
                        node: node,
                    },
                ],
            };

            page.items.push(item);
            ++rowIndex;
            columnIndex = 0;
        }
    }

    private addBarChart(page: DashboardPage, properties: aas.Property[], nodes: LiveNode[] | null): void {
        const rowIndex = page.items.length > 0 ? Math.max(...page.items.map(item => item.positions[0].y)) + 1 : 0;
        const item: DashboardChart = {
            label: '',
            id: uuid(),
            type: DashboardItemType.Chart,
            chartType: DashboardChartType.BarVertical,
            positions: [{ x: 0, y: rowIndex }],
            sources: [],
        };

        for (const property of properties) {
            let node: LiveNode | null = null;
            if (nodes != null && property.nodeId && !this.containsNode(nodes, property.nodeId)) {
                node = { nodeId: property.nodeId, valueType: property.valueType ?? 'undefined' };
                nodes.push(node);
            }

            item.sources.push({
                label: property.idShort,
                color: this.createRandomColor(),
                element: property,
                node: node,
            });
        }

        page.items.push(item);
    }

    private addScatterChart(document: AASDocument, page: DashboardPage, blobs: aas.Blob[]): void {
        let columnIndex = 0;
        let rowIndex = page.items.length > 0 ? Math.max(...page.items.map(item => item.positions[0].y)) + 1 : 0;
        for (const blob of blobs) {
            if (blob.parent) {
                const label = blob.idShort;
                const name = encodeBase64Url(document.endpoint);
                const id = encodeBase64Url(document.id);
                const smId = encodeBase64Url(blob.parent.keys[0].value);
                const path = getIdShortPath(blob);
                const item: DashboardChart = {
                    label: label,
                    id: uuid(),
                    type: DashboardItemType.Chart,
                    chartType: DashboardChartType.TimeSeries,
                    positions: [{ x: columnIndex, y: rowIndex }],
                    sources: [
                        {
                            label: blob.idShort,
                            color: this.createRandomColor(),
                            element: blob,
                            node: null,
                            url: `/api/v1/containers/${name}/documents/${id}/submodels/${smId}/blobs/${path}/value`,
                        },
                    ],
                };

                page.items.push(item);
                ++rowIndex;
                columnIndex = 0;
            }
        }
    }

    private getNodes(page: DashboardPage, document: AASDocument): LiveNode[] | null {
        let nodes: LiveNode[] | null = null;
        if (document.onlineReady) {
            const index = this.indexOfRequest(page, document);
            if (index >= 0) {
                const request = page.requests[index];
                nodes = [...request.nodes];
                page.requests[index] = { ...request, nodes };
            } else {
                nodes = [];
                page.requests.push({
                    endpoint: document.endpoint,
                    id: document.id,
                    nodes: nodes,
                });
            }
        }

        return nodes;
    }

    private getRow(page: DashboardPage, item: DashboardItem): DashboardItem[] {
        const y = item.positions[0].y;
        const row = page.items.filter(item => item.positions[0].y === y);
        row.sort((a, b) => a.positions[0].x - b.positions[0].x);
        return row;
    }

    private indexOfRequest(page: DashboardPage, document: AASDocument): number {
        const name = document.endpoint;
        const id = document.id;
        return page.requests.findIndex(item => {
            return item.endpoint === name && item.id === id;
        });
    }

    private containsNode(nodes: LiveNode[], nodeId: string): boolean {
        return nodes.some(node => node.nodeId === nodeId);
    }

    private savePages(): Observable<void> {
        if (this._pages.length > 0) {
            return this.auth.setCookie('.Dashboard', JSON.stringify(this._pages));
        }

        return this.auth.deleteCookie('.Dashboard');
    }

    private saveCurrentPage(): Observable<void> {
        return this.auth.setCookie('.DashboardPage', this._pages[this.index$.getValue()].name);
    }

    private createRandomColor(): string {
        const red = Math.trunc(Math.random() * 255).toString(16);
        const green = Math.trunc(Math.random() * 255).toString(16);
        const blue = Math.trunc(Math.random() * 255).toString(16);
        return '#' + red + green + blue;
    }

    private updatePage(page: DashboardPage): void {
        const pages = [...this._pages];
        const index = pages.findIndex(item => item.name === page.name);
        pages[index] = page;
        this._pages = pages;
    }

    private addNewPage(name?: string): void {
        name = name?.trim() ?? this.createPageName(this._pages);
        const page: DashboardPage = {
            name: name,
            items: [],
            requests: [],
        };

        this._pages = [...this.pages, page];
    }

    private createPageName(pages: DashboardPage[] = []): string {
        let name = '';
        for (let i = 1; i < Number.MAX_SAFE_INTEGER; i++) {
            name = 'Dashboard ' + i;
            if (!pages.find(page => page.name === name)) {
                return name;
            }
        }

        throw new Error('Unable to create unique name.');
    }

    private deletePage(page: DashboardPage): void {
        const pages = [...this._pages];
        const index = pages.indexOf(page);
        if (index < 0) {
            return;
        }

        pages.splice(index, 1);
        if (pages.length === 0) {
            pages.push({ name: this.createPageName(pages), items: [], requests: [] });
        }

        let selectedIndex = this.index$.getValue();
        if (index === selectedIndex) {
            selectedIndex = Math.min(pages.length - 1, index);
        } else if (index < selectedIndex) {
            --selectedIndex;
        }

        this._pages = pages;
        this.index$.next(selectedIndex);
    }

    private renamePage(page: DashboardPage, name: string): void {
        const index = this._pages.indexOf(page);
        if (index < 0) {
            return;
        }

        const pages = [...this._pages];
        pages[index] = { ...page, name };
        this._pages = pages;
    }
}
