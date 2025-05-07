/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Chart, ChartConfiguration, ChartDataset } from 'chart.js';
import { aas, LiveNode, LiveRequest } from 'aas-core';

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

export type DashboardSource = {
    label: string;
    color: DashboardColor;
    element: aas.Property | aas.Blob;
    node: LiveNode | null;
    url?: string;
};

export type DashboardItemPosition = {
    x: number;
    y: number;
};

export interface DashboardItem {
    type: DashboardItemType;
    id: string;
    position: DashboardItemPosition;
}

export type DashboardSelectable = {
    selected: boolean;
    column: DashboardItem;
};

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

export type DashboardPage = {
    name: string;
    active: boolean;
    items: DashboardItem[];
    requests: LiveRequest[];
};

export type DashboardColumn = {
    id: string;
    item: DashboardItem;
    itemType: DashboardItemType;
};

export type DashboardRow = {
    columns: DashboardColumn[];
};

export type DashboardState = DashboardPage[];

export type UpdateTuple = {
    item: DashboardChart;
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


export type DashboardCard = {
    name: string;
    item: DashboardItem;
    requests: LiveRequest[];
};
