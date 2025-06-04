/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'chart.js/auto';

import isNumber from 'lodash-es/isNumber';
import { Chart, ChartConfiguration, ChartDataset, ChartType } from 'chart.js';
import { aas, LiveNode, LiveRequest, parseNumber, WebSocketData } from 'aas-core';
import { DashboardApiService } from './dashboard-api.service';

import {
    ChartConfigurationTuple,
    DashboardChartItem,
    DashboardChartType,
    TimeSeries,
    UpdateTuple,
} from './dashboard-types';

export abstract class Dashboard {
    protected constructor(public readonly api: DashboardApiService) { }

    protected readonly map = new Map<string, UpdateTuple>();

    protected createChart(item: DashboardChartItem, canvas: HTMLCanvasElement): ChartConfigurationTuple {
        switch (item.chartType()) {
            case DashboardChartType.Line:
                return this.createLineChart(item, canvas);
            case DashboardChartType.BarVertical:
                return this.createVerticalBarChart(item, canvas);
            case DashboardChartType.BarHorizontal:
                return this.createHorizontalBarChart(item, canvas);
            case DashboardChartType.TimeSeries:
                return this.createTimeSeriesChart(item, canvas);
            default:
                throw new Error(`Chart type "${item.chartType()}" is not supported.`);
        }
    }

    protected updateChart(node: LiveNode, tuple: UpdateTuple, cfg: ChartConfigurationTuple): void {
        switch (tuple.item.chartType()) {
            case DashboardChartType.Line:
                this.updateLineChart(cfg, tuple.dataset, node);
                break;
            case DashboardChartType.BarHorizontal:
            case DashboardChartType.BarVertical:
                this.updateBarChart(cfg, tuple.dataset, node);
                break;
        }
    }

    protected createMessage(request: LiveRequest): WebSocketData {
        return {
            type: 'LiveRequest',
            data: request,
        };
    }

    private updateLineChart(tuple: ChartConfigurationTuple, dataset: ChartDataset, node: LiveNode) {
        if (tuple) {
            const data = dataset.data as number[];
            const labels = tuple.configuration.data.labels!;

            if (data.length > 100) {
                data.shift();
                labels.shift();
            }

            let y = 0;
            if (isNumber(node.value)) {
                y = node.value;
            } else if (this.isBigInt(node.value)) {
                y = this.toNumber(node.value);
            }

            data.push(y);

            if (labels.length < data.length) {
                const x = new Date(node.timeStamp as number).toLocaleTimeString() ?? new Date().toLocaleTimeString();
                labels.push(x);
            }

            tuple.chart.update();
        }
    }

    private updateBarChart(tuple: ChartConfigurationTuple, dataset: ChartDataset, node: LiveNode) {
        if (tuple) {
            const data = dataset.data as number[];
            let y = 0;
            if (isNumber(node.value)) {
                y = node.value;
            } else if (this.isBigInt(node.value)) {
                y = this.toNumber(node.value);
            }

            data[0] = y;

            tuple.chart.update();
        }
    }

    private createLineChart(item: DashboardChartItem, canvas: HTMLCanvasElement): ChartConfigurationTuple {
        const configuration: ChartConfiguration<ChartType, number[], string> = {
            type: 'line',
            data: {
                labels: [],
                datasets: [],
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: item.min,
                        max: item.max,
                    },
                },
            },
        };

        let length = 0;
        for (const source of item.sources) {
            const dataset: ChartDataset<ChartType, number[]> = {
                type: 'line',
                label: source.label,
                backgroundColor: source.color,
                borderColor: source.color,
                borderWidth: 1,
                data: [],
            };

            configuration.data.datasets.push(dataset);
            if (source.node) {
                this.map.set(source.node.nodeId, { item, dataset });
            }

            dataset.data = this.getInitialLineChartData(source.element as aas.Property);
            length = Math.max(length, dataset.data.length);
        }

        for (let i = 0; i < length; i++) {
            configuration.data.labels!.push(i.toLocaleString());
        }

        return { chart: new Chart(canvas, configuration), configuration };
    }

    private createVerticalBarChart(item: DashboardChartItem, canvas: HTMLCanvasElement): ChartConfigurationTuple {
        const configuration: ChartConfiguration<ChartType, number[], string> = {
            type: 'bar',
            data: {
                labels: [item.label],
                datasets: [],
            },
            options: {
                indexAxis: 'x',
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: item.min,
                        max: item.max,
                    },
                },
            },
        };

        for (const source of item.sources) {
            const dataset: ChartDataset<ChartType, number[]> = {
                type: 'bar',
                label: source.label,
                backgroundColor: source.color,
                borderColor: source.color,
                borderWidth: 1,
                data: [0],
            };

            configuration.data.datasets.push(dataset);
            if (source.node) {
                this.map.set(source.node.nodeId, { item, dataset });
            }

            dataset.data[0] = this.getInitialBarChartData(source.element as aas.Property);
        }

        return { chart: new Chart(canvas, configuration), configuration };
    }

    private createHorizontalBarChart(item: DashboardChartItem, canvas: HTMLCanvasElement): ChartConfigurationTuple {
        const configuration: ChartConfiguration<ChartType, number[], string> = {
            type: 'bar',
            data: {
                labels: [item.label],
                datasets: [],
            },
            options: {
                indexAxis: 'y',
                maintainAspectRatio: false,
                scales: {
                    x: {
                        min: item.min,
                        max: item.max,
                    },
                },
            },
        };

        for (const source of item.sources) {
            const dataset: ChartDataset<ChartType, number[]> = {
                type: 'bar',
                label: source.label,
                backgroundColor: source.color,
                borderColor: source.color,
                borderWidth: 1,
                data: [0],
            };

            configuration.data.datasets.push(dataset);
            if (source.node) {
                this.map.set(source.node.nodeId, { item, dataset });
            }

            dataset.data[0] = this.getInitialBarChartData(source.element as aas.Property);
        }

        return { chart: new Chart(canvas, configuration), configuration };
    }

    private createTimeSeriesChart(item: DashboardChartItem, canvas: HTMLCanvasElement): ChartConfigurationTuple {
        const configuration: ChartConfiguration<ChartType, number[], string> = {
            type: 'line',
            data: {
                labels: [],
                datasets: [],
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: item.min,
                        max: item.max,
                    },
                },
                plugins: {
                    decimation: {
                        enabled: true,
                        algorithm: 'min-max',
                    },
                },
            },
        };

        for (const source of item.sources) {
            if (source.url) {
                const dataset: ChartDataset<ChartType, number[]> = {
                    type: 'line',
                    label: source.label,
                    backgroundColor: source.color,
                    borderColor: source.color,
                    borderWidth: 1,
                    data: [],
                    animation: false,
                    pointRadius: 0,
                };

                configuration.data.datasets.push(dataset);
                if (source.node) {
                    this.map.set(source.node.nodeId, { item, dataset });
                }

                this.getTimeSeriesData(source.url, dataset.data, configuration.data.labels!);
            }
        }

        return { chart: new Chart(canvas, configuration), configuration };
    }

    private getInitialLineChartData(property: aas.Property): number[] {
        return [property.value ? parseNumber(property.value) : 0];
    }

    private getInitialBarChartData(property: aas.Property): number {
        return property.value ? parseNumber(property.value) : 0;
    }

    private getTimeSeriesData(url: string, data: number[], labels: string[]): void {
        this.api.getBlobValue(url).subscribe(value => {
            const timeSeries: TimeSeries = JSON.parse(window.atob(value));
            if (timeSeries.timestamp && timeSeries.value) {
                const n = Math.min(timeSeries.value.length, timeSeries.timestamp.length);
                for (let i = 0; i < n; i++) {
                    data.push(parseNumber(timeSeries.value[i]));
                    labels.push(timeSeries.timestamp[i]);
                }
            }
        });
    }

    private isBigInt(y: unknown): y is number[] {
        return Array.isArray(y) && y.length === 2 && isNumber(y[0]) && isNumber(y[1]);
    }

    private toNumber(value: number[]): number {
        return value[0] === 0 ? value[1] : value[0] * 4294967296 + value[1];
    }
}