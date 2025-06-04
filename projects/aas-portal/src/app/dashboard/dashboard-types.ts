/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Chart, ChartConfiguration, ChartDataset } from 'chart.js';
import { aas, LiveNode, LiveRequest } from 'aas-core';
import { WritableSignal } from '@angular/core';

export type DashboardColor = string;

export enum ViewPortSize { 
    xs = 1,
    sm = 2,
    md = 3,
    lg = 4,
};

export enum DashboardChartType {
    Line = 'Line',
    BarVertical = 'BarVertical',
    BarHorizontal = 'BarHorizontal',
    TimeSeries = 'TimeSeries',
}

export type DashboardSource = {
    label: string;
    color: DashboardColor;
    element: aas.Property | aas.Blob;
    node: LiveNode | null;
    url?: string;
};

export interface DashboardChart {
    id: string;
    label: string;
    chartType: DashboardChartType;
    sources: DashboardSource[];
    min?: number;
    max?: number;
}

export interface DashboardChartItem {
    id: string;
    label: string;
    chartType: WritableSignal<DashboardChartType>;
    sources: DashboardSource[];
    min?: number;
    max?: number;
    selected: WritableSignal<boolean>;
    source: WritableSignal<string | undefined>;
}

export type DashboardPage = {
    name: string;
    active: boolean;
    items: DashboardChartItem[];
    requests: LiveRequest[];
};

export type DashboardState = DashboardPage[];

export type UpdateTuple = {
    item: DashboardChartItem;
    dataset: ChartDataset;
};

export type ChartConfigurationTuple = {
    chart: Chart;
    configuration: ChartConfiguration;
};

export type TimeSeries = {
    value: string[];
    timestamp: string[];
};
