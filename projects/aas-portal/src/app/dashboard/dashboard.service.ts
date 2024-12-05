/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, computed } from '@angular/core';
import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash-es/cloneDeep';
import { encodeBase64Url } from 'aas-lib';
import { aas, AASDocument, getIdShortPath, getUnit, LiveNode } from 'aas-core';

import {
    DashboardChart,
    DashboardChartType,
    DashboardItemType,
    DashboardPage,
    DashboardStore,
} from './dashboard.store';

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    public constructor(private readonly store: DashboardStore) {}

    public readonly activePage = computed(() => this.store.activePage$().name);

    public readonly pages = computed(() => this.store.pages$().map(page => page.name));

    public setActivePage(name: string): void {
        this.store.setActivePage(name);
    }

    public add(
        name: string,
        document: AASDocument,
        elements: aas.SubmodelElement[],
        chartType: DashboardChartType,
    ): void {
        const page = cloneDeep(this.store.getPage(name));
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

            this.store.modified$.set(true);
        }

        if (blobs.length > 0) {
            this.addScatterChart(document, page, blobs);
            this.store.modified$.set(true);
        }

        if (this.store.modified$()) {
            this.store.update(page);
        }
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
}
