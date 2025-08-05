/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, WritableSignal, computed, signal, untracked } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { EMPTY, map, mergeMap, Observable, skipWhile, tap } from 'rxjs';
import { aas, AASDocument, getIdShortPath, getUnit, LiveNode } from 'aas-core';
import { AuthService, encodeBase64Url } from 'aas-lib';

import {
    DashboardChartItem,
    DashboardChartType,
    DashboardPage,
    DashboardSource,
    DashboardState,
} from './dashboard-types';

const initialState: DashboardState = [{ name: 'Dashboard 1', active: true, items: [], requests: [] }];

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    private readonly state = signal<DashboardState>(initialState);
    private readonly modified$ = signal(false);

    public constructor(private readonly auth: AuthService) {
        this.auth.ready
            .pipe(
                skipWhile(ready => ready === false),
                mergeMap(() => this.auth.getCookie('.Dashboard.v4')),
                map(data => {
                    if (data === undefined) {
                        return undefined;
                    }

                    const pages: DashboardPage[] = DashboardService.fromString(data);
                    if (pages.length === 0) {
                        return undefined;
                    }

                    return pages;
                }),
            )
            .subscribe(value => {
                if (value !== undefined) {
                    return this.state.set(value);
                }
            });
    }

    public readonly pages = this.state.asReadonly();

    public readonly activePage = computed(() => this.state().find(page => page.active)!);

    public readonly editMode = signal(false);

    public getMemento(): string {
        return this.toString(untracked(this.state));
    }

    public setMemento(data: string): void {
        this.state.set(DashboardService.fromString(data));
    }

    public setActivePage(name: string): void {
        this.state.update(state => {
            if (!state.some(page => page.name === name)) {
                return state;
            }

            return state.map(page => {
                if (page.name === name) {
                    return page.active ? page : ({ ...page, active: true } satisfies DashboardPage);
                }

                return page.active ? ({ ...page, active: false } satisfies DashboardPage) : page;
            });
        });

        this.modified$.set(true);
    }

    public addChart(
        name: string,
        document: AASDocument,
        elements: aas.SubmodelElement[],
        chartType: DashboardChartType,
    ): void {
        let page = this.getPage(name);
        if (page === undefined) {
            return;
        }

        page = { ...page, items: [...page.items] };
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
        this.state.update(state => state.map(item => (item.name === name ? page : item)));
        this.modified$.set(true);
    }

    public addPage(page: DashboardPage): void {
        this.state.update(state => [...state, page]);
    }

    public deletePage(page: DashboardPage): void {
        this.state.update(state => {
            let index = state.indexOf(page);
            if (index < 0) {
                return state;
            }

            const pages = state.filter(item => item !== page);
            if (!page.active) {
                return pages;
            }

            index = Math.min(pages.length - 1, index);
            pages[index] = { ...pages[index], active: true };
            return pages;
        });
    }

    public createPageName(pages?: DashboardPage[]): string {
        pages = pages ?? this.state();
        let name = '';
        for (let i = 1; i < Number.MAX_SAFE_INTEGER; i++) {
            name = 'Dashboard ' + i;
            if (!pages.find(page => page.name === name)) {
                return name;
            }
        }

        throw new Error('Unable to create unique name.');
    }

    public save(): Observable<void> {
        if (!this.modified$()) {
            return EMPTY;
        }

        return this.savePages().pipe(tap(() => this.modified$.set(false)));
    }

    public toString(data: DashboardState): string {
        return JSON.stringify(data, (key, value) => {
            if (key === 'selected') {
                return (value as WritableSignal<boolean>)();
            }

            if (key === 'source') {
                return (value as WritableSignal<string | undefined>)();
            }

            if (key === 'chartType') {
                return (value as WritableSignal<DashboardChartType>)();
            }

            return value;
        });
    }

    public static fromString(data: string): DashboardState {
        return JSON.parse(data, (key, value) => {
            if (key === 'selected') {
                return signal(value);
            }

            if (key === 'source') {
                return signal(value);
            }

            if (key === 'chartType') {
                return signal(value);
            }

            return value;
        });
    }

    private getPage(name: string): DashboardPage | undefined {
        return untracked(this.state).find(page => page.name === name);
    }

    private addLineCharts(
        page: DashboardPage,
        env: aas.Environment,
        properties: aas.Property[],
        nodes: LiveNode[] | null,
    ): void {
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

            const source: DashboardSource = {
                label: property.idShort,
                color: this.createRandomColor(),
                element: property,
                node: node,
            };

            const item: DashboardChartItem = {
                label: label,
                id: uuid(),
                chartType: signal(DashboardChartType.Line),
                sources: [source],
                selected: signal(false),
                source: signal(source.label),
            };

            page.items.push(item);
        }
    }

    private addBarChart(page: DashboardPage, properties: aas.Property[], nodes: LiveNode[] | null): void {
        const item: DashboardChartItem = {
            label: '',
            id: uuid(),
            chartType: signal(DashboardChartType.BarVertical),
            sources: [],
            selected: signal(false),
            source: signal(undefined),
        };

        for (const property of properties) {
            let node: LiveNode | null = null;
            if (nodes != null && property.nodeId && !this.containsNode(nodes, property.nodeId)) {
                node = { nodeId: property.nodeId, valueType: property.valueType ?? 'undefined' };
                nodes.push(node);
            }

            const source: DashboardSource = {
                label: property.idShort,
                color: this.createRandomColor(),
                element: property,
                node: node,
            };

            item.sources.push(source);
            if (!item.source()) {
                item.source.set(source.label);
            }
        }

        page.items.push(item);
    }

    private addScatterChart(document: AASDocument, page: DashboardPage, blobs: aas.Blob[]): void {
        for (const blob of blobs) {
            if (blob.parent) {
                const label = blob.idShort;
                const name = encodeBase64Url(document.endpoint);
                const id = encodeBase64Url(document.id);
                const smId = encodeBase64Url(blob.parent.keys[0].value);
                const path = getIdShortPath(blob);
                const source: DashboardSource = {
                    label: blob.idShort,
                    color: this.createRandomColor(),
                    element: blob,
                    node: null,
                    url: `/api/v1/endpoints/${name}/documents/${id}/submodels/${smId}/blobs/${path}/value`,
                };

                const item: DashboardChartItem = {
                    label: label,
                    id: uuid(),
                    chartType: signal(DashboardChartType.TimeSeries),
                    sources: [source],
                    selected: signal(false),
                    source: signal(source.label),
                };

                page.items.push(item);
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
        const pages = untracked(this.state);
        if (pages.length > 0) {
            return this.auth.setCookie('.Dashboard.v4', this.toString(pages));
        }

        return this.auth.deleteCookie('.Dashboard.v4');
    }
}
