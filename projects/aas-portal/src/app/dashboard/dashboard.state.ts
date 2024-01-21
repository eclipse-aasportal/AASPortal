/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { LiveNode, LiveRequest, aas } from 'common';
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
    name: string;
    pages: DashboardPage[];
    editMode: boolean;
    selectionMode: SelectionMode;
    rows: DashboardRow[];
}

export interface State {
    dashboard: DashboardState;
}