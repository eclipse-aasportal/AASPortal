/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { aas, AASDocument, AASEndpointType, ApplicationError, EndpointType, getIdShortPath, getUnit, LiveNode } from 'common';
import { cloneDeep } from 'lodash-es';
import { ERRORS } from '../types/errors';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { encodeBase64Url, AuthService } from 'projects/aas-lib/src/public-api';
import * as DashboardSelectors from './dashboard.selectors';
import * as DashboardActions from './dashboard.actions';
import { createPageName } from './dashboard.reducer';
import {
    DashboardItemType,
    DashboardChart,
    DashboardPage,
    DashboardChartType,
    DashboardItem,
    DashboardRow,
    State
} from './dashboard.state';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private readonly store: Store<State>;
    private _pages: DashboardPage[] = [];
    private _name = '';
    private modified = false;

    constructor(
        store: Store,
        private auth: AuthService
    ) {
        this.store = store as Store<State>;

        this.store.dispatch(DashboardActions.setPages({ pages: this.read() }));
        this.pages = this.store.select(DashboardSelectors.selectPages);
        this.name = this.store.select(DashboardSelectors.selectName);

        this.pages.subscribe(pages => this._pages = pages);
        this.name.subscribe(name => this._name = name);
    }

    public get defaultPage(): DashboardPage {
        return this._pages.length > 0 ? this._pages[0] : { name: '-', items: [], requests: [] };
    }

    public readonly name: Observable<string>;

    public readonly pages: Observable<DashboardPage[]>;

    public find(name: string): DashboardPage | undefined {
        return this._pages.find(item => item.name === name);
    }

    public setPageName(name: string) {
        if (this._name !== name) {
            if (!this.find(name)) {
                throw new Error(`A dashboard with the name "${name}" does not exist.`);
            }

            this.store.dispatch(DashboardActions.setPageName({ name }));
        }
    }

    public add(name: string, document: AASDocument, elements: aas.SubmodelElement[], chartType: DashboardChartType): void {
        const pages = this._pages;
        const i = pages.findIndex(item => item.name === name);
        if (i < 0) {
            throw new Error(`A dashboard with the name "${name}" does not exist.`);
        }

        const page = cloneDeep(pages[i]);
        const properties = elements.filter(item => item.modelType === 'Property')
            .map(item => item as aas.Property);

        const blobs = elements.filter(item => item.modelType === 'Blob')
            .map(item => item as aas.Blob);

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
            this.store.dispatch(DashboardActions.updatePage({ page }));
        }
    }

    public addNew(name?: string): void {
        name = name?.trim();
        if (!name && this._pages.some(item => item.name === name)) {
            throw new ApplicationError(
                `A page withe name "${name}" already exists.`,
                ERRORS.DASHBOARD_PAGE_ALREADY_EXISTS,
                name);
        }

        this.store.dispatch(DashboardActions.addNewPage({ name }));
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
                name);
        }

        this.store.dispatch(DashboardActions.renamePage({ page, name }));
        this.modified = true;
    }

    public getGrid(page: DashboardPage): DashboardItem[][] {
        const map = new Map<number, DashboardItem[]>();
        page.items.forEach(item => {
            const y = item.positions[0].y
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
                row.sort((a, b) => a.positions[0].x - b.positions[0].x);
                grid.push(row);
                ++i;
            }

            ++y;
        }

        return grid;
    }

    public getRows(page: DashboardPage): DashboardRow[] {
        return this.getGrid(page).map(row => ({
            columns: row.map(item => ({
                id: item.id,
                item: item,
                itemType: item.type
            }))
        }));
    }

    public canMoveLeft(page: DashboardPage, item: DashboardItem): boolean {
        return item.positions[0].x > 0
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
                return true
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

    public update(page: DashboardPage, rows?: DashboardRow[]): void {
        this.store.dispatch(DashboardActions.updatePage({ page, rows }));
        this.modified = true;
    }

    public delete(page: DashboardPage): void {
        this.store.dispatch(DashboardActions.deletePage({ page }));
        this.modified = true;
    }

    public save(): void {
        if (this.modified) {
            this.write();
            this.modified = false;
        }
    }

    private addLineCharts(
        page: DashboardPage,
        env: aas.Environment,
        properties: aas.Property[],
        nodes: LiveNode[] | null): void {
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
                sources: [{
                    label: property.idShort,
                    color: this.createRandomColor(),
                    element: property,
                    node: node,
                }]
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
            sources: []
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
                const url = encodeBase64Url(document.endpoint.url);
                const id = encodeBase64Url(document.id);
                const smId = encodeBase64Url(blob.parent.keys[0].value);
                const path = getIdShortPath(blob);
                const item: DashboardChart = {
                    label: label,
                    id: uuid(),
                    type: DashboardItemType.Chart,
                    chartType: DashboardChartType.TimeSeries,
                    positions: [{ x: columnIndex, y: rowIndex }],
                    sources: [{
                        label: blob.idShort,
                        color: this.createRandomColor(),
                        element: blob,
                        node: null,
                        url: `/api/v1/containers/${url}/documents/${id}/submodels/${smId}/blobs/${path}/value`
                    }]
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
                    type: this.toEndpointType(document.endpoint.type),
                    url: document.endpoint.url,
                    id: document.id,
                    nodes: nodes
                });
            }
        }

        return nodes;
    }

    private toEndpointType(type: AASEndpointType): EndpointType {
        switch (type) {
            case 'OpcuaServer':
                return 'opc';
            case 'AasxDirectory':
                return 'file';
            default:
                return 'http';
        }
    }

    private getRow(page: DashboardPage, item: DashboardItem): DashboardItem[] {
        const y = item.positions[0].y;
        const row = page.items.filter(item => item.positions[0].y === y);
        row.sort((a, b) => a.positions[0].x - b.positions[0].x);
        return row;
    }

    private indexOfRequest(page: DashboardPage, document: AASDocument): number {
        const url = document.endpoint.url;
        const type = this.toEndpointType(document.endpoint.type);
        const id = document.id;
        return page.requests.findIndex(item => {
            return item.url === url && (type === 'opc' || item.id === id);
        });
    }

    private containsNode(nodes: LiveNode[], nodeId: string): boolean {
        return nodes.some(node => node.nodeId === nodeId);
    }

    private write(): void {
        if (this._pages.length > 0) {
            this.auth.setCookie('.Dashboard', JSON.stringify(this._pages));
        } else {
            this.auth.deleteCookie('.Dashboard');
        }
    }

    private read(): DashboardPage[] {
        const value = this.auth.getCookie('.Dashboard');
        if (value) {
            return JSON.parse(value);
        }

        return [{ name: createPageName(), items: [], requests: [] }];
    }

    private createRandomColor(): string {
        const red = Math.trunc(Math.random() * 255).toString(16);
        const green = Math.trunc(Math.random() * 255).toString(16);
        const blue = Math.trunc(Math.random() * 255).toString(16);
        return '#' + red + green + blue;
    }
}