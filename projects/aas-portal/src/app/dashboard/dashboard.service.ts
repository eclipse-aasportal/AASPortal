/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, computed, signal, untracked } from '@angular/core';
import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash-es/cloneDeep';
import { AuthService, encodeBase64Url } from 'aas-lib';
import { EMPTY, map, mergeMap, Observable, of, skipWhile, tap, zip } from 'rxjs';
import { aas, AASDocument, getIdShortPath, getUnit, LiveNode } from 'aas-core';
import { SelectionMode } from '../types/selection-mode';

import {
    DashboardChart,
    DashboardChartType,
    DashboardItem,
    DashboardItemType,
    DashboardPage,
    DashboardState,
} from './dashboard-types';

const initialState: DashboardState = [{ name: 'Dashboard 1', active: true, items: [], requests: [] }];

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    private readonly pages$ = signal<DashboardState>(initialState);
    private readonly modified$ = signal(false);

    public constructor(private readonly auth: AuthService) {
        this.auth.userId
            .pipe(
                skipWhile(userId => userId === undefined),
                mergeMap(() => this.auth.getCookie('.Dashboard.v1')),
                map(data => {
                    if (data === undefined) {
                        return undefined;
                    }

                    const pages: DashboardPage[] = JSON.parse(data);
                    if (pages.length === 0) {
                        return undefined;
                    }

                    return pages;
                }),
            )
            .subscribe(value => {
                if (value !== undefined) {
                    return this.pages$.set(value);
                }
            });
    }

    public readonly pages = this.pages$.asReadonly();

    public readonly activePage = computed(() => this.pages$().find(page => page.active)!);

    public readonly selectionMode = signal(SelectionMode.Single);

    public readonly editMode = signal(false);

    public readonly rows = computed(() => {
        const page = this.activePage();
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

    public get (): DashboardState {
        return cloneDeep(untracked(this.pages$));
    }

    public set memento(value: DashboardState) {
        this.pages$.set(cloneDeep(value));
    }

    public setActivePage(name: string): void {
        this.pages$.update(state => {
            if (!state.some(page => page.name === name)) {
                return state;
            }

            return state.map(page => {
                if (page.name === name) {
                    return page.active ? page : {...page, active: true } satisfies DashboardPage;
                }

                return page.active ? { ...page, active: false } satisfies DashboardPage : page;
            });
        });

        this.modified$.set(true);
    }

    public setState(state: DashboardPage[]): void {
        this.pages$.set(state);
        this.modified$.set(true);
    }

    public add(
        name: string,
        document: AASDocument,
        elements: aas.SubmodelElement[],
        chartType: DashboardChartType,
    ): void {
        const page = cloneDeep(this.getPage(name));
        if (page === undefined) {
            return;
        }

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

            this.modified$.set(true);
        }

        if (blobs.length > 0) {
            this.addScatterChart(document, page, blobs);
            this.modified$.set(true);
        }

        if (this.modified$()) {
            this.updatePage(page);
        }
    }

    public updatePage(page: DashboardPage, name?: string): void {
        name = name ?? page.name;
        this.pages$.update(state => state.map(item => item.name === name ? page : item));
        this.modified$.set(true);
    }

    public addPage(page: DashboardPage): void {
        this.pages$.update(state => [...state, page]);
    }

    public deletePage(page: DashboardPage): void {
        this.pages$.update(state => {
            let index = state.indexOf(page);
            if (index < 0) {
                return state;
            }

            const pages = state.filter(item => item !== page);
            if (!page.active) {
                return pages;
            }

            index = Math.min(pages.length - 1, index);
            pages[index] = {...pages[index], active: true };
            return pages;
        });
    }

    public createPageName(pages?: DashboardPage[]): string {
        pages = pages ?? this.pages$();
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
            const y = item.position.y;
            let row = map.get(y);
            if (!row) {
                row = [];
                map.set(y, row);
            }

            row.push(item);
        });

        const grid: DashboardItem[][] = [];
        let y = 0;
        for (let i = 0; i < map.size;) {
            const row = map.get(y);
            if (row) {
                row.sort((a, b) => a.position.x - b.position.x);
                grid.push(row);
                ++i;
            }

            ++y;
        }

        return grid;
    }

    public canMoveDown(page: DashboardPage, item: DashboardItem): boolean {
        const grid = this.getGrid(page);
        const y = item.position.y;
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
        return item.position.x > 0;
    }

    public canMoveRight(page: DashboardPage, item: DashboardItem): boolean {
        const row = this.getRow(page, item);
        return item.position.x < row.length - 1;
    }

    public canMoveUp(page: DashboardPage, item: DashboardItem): boolean {
        const grid = this.getGrid(page);
        const y = item.position.y;
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
        if (!this.modified$()) {
            return EMPTY;
        }

        return this.savePages().pipe(tap(() => this.modified$.set(false)));
    }

    private getRow(page: DashboardPage, item: DashboardItem): DashboardItem[] {
        const y = item.position.y;
        const row = page.items.filter(item => item.position.y === y);
        row.sort((a, b) => a.position.x - b.position.x);
        return row;
    }

    private getPage(name: string): DashboardPage | undefined {
        return untracked(this.pages$).find(page => page.name === name);
    }

    private addLineCharts(
        page: DashboardPage,
        env: aas.Environment,
        properties: aas.Property[],
        nodes: LiveNode[] | null,
    ): void {
        let columnIndex = 0;
        let rowIndex = page.items.length > 0 ? Math.max(...page.items.map(item => item.position.y)) + 1 : 0;
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
                position: { x: columnIndex, y: rowIndex },
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
        const rowIndex = page.items.length > 0 ? Math.max(...page.items.map(item => item.position.y)) + 1 : 0;
        const item: DashboardChart = {
            label: '',
            id: uuid(),
            type: DashboardItemType.Chart,
            chartType: DashboardChartType.BarVertical,
            position: { x: 0, y: rowIndex },
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
        let rowIndex = page.items.length > 0 ? Math.max(...page.items.map(item => item.position.y)) + 1 : 0;
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
                    position: { x: columnIndex, y: rowIndex },
                    sources: [
                        {
                            label: blob.idShort,
                            color: this.createRandomColor(),
                            element: blob,
                            node: null,
                            url: `/api/v1/endpoints/${name}/documents/${id}/submodels/${smId}/blobs/${path}/value`,
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

    private createRandomColor(): string {
        const red = Math.trunc(Math.random() * 255).toString(16);
        const green = Math.trunc(Math.random() * 255).toString(16);
        const blue = Math.trunc(Math.random() * 255).toString(16);
        return '#' + red + green + blue;
    }

    private savePages(): Observable<void> {
        const pages = untracked(this.pages$);
        if (pages.length > 0) {
            return this.auth.setCookie('.Dashboard.v1', JSON.stringify(pages));
        }

        return this.auth.deleteCookie('.Dashboard.v1');
    }
}
