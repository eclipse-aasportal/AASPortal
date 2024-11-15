/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'chart.js/auto';
import { WebSocketSubject } from 'rxjs/webSocket';
import { ActivatedRoute } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    QueryList,
    TemplateRef,
    ViewChild,
    ViewChildren,
    computed,
    effect,
    untracked,
    ChangeDetectionStrategy,
} from '@angular/core';

import isNumber from 'lodash-es/isNumber';
import { Chart, ChartConfiguration, ChartDataset, ChartType } from 'chart.js';
import { aas, convertToString, LiveNode, LiveRequest, parseNumber, WebSocketData } from 'aas-core';
import { ClipboardService, LogType, NotifyService, WebSocketFactoryService, WindowService } from 'aas-lib';

import { SelectionMode } from '../types/selection-mode';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommandHandlerService } from '../aas/command-handler.service';
import { MoveLeftCommand } from './commands/move-left-command';
import { MoveRightCommand } from './commands/move-right-command';
import { MoveUpCommand } from './commands/move-up-command';
import { MoveDownCommand } from './commands/move-down-command';
import { SetColorCommand } from './commands/set-color-command';
import { DeletePageCommand } from './commands/delete-page-command';
import { RenamePageCommand } from './commands/rename-page-command';
import { AddNewPageCommand } from './commands/add-new-page-command';
import { DeleteItemCommand } from './commands/delete-item-command';
import { SetChartTypeCommand } from './commands/set-chart-type-command';
import { SetMinMaxCommand } from './commands/set-min-max-command';
import { DashboardQuery, DashboardQueryParams } from '../types/dashboard-query-params';
import { DashboardApiService } from './dashboard-api.service';
import { ToolbarService } from '../toolbar.service';
import {
    DashboardChart,
    DashboardChartType,
    DashboardColumn,
    DashboardItem,
    DashboardItemType,
    DashboardPage,
    DashboardService,
} from './dashboard.service';

interface UpdateTuple {
    item: DashboardChart;
    dataset: ChartDataset;
}

interface ChartConfigurationTuple {
    chart: Chart;
    configuration: ChartConfiguration;
}

interface TimeSeries {
    value: string[];
    timestamp: string[];
}

@Component({
    selector: 'fhg-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: true,
    imports: [NgClass, FormsModule, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
    private readonly map = new Map<string, UpdateTuple>();
    private readonly charts = new Map<string, ChartConfigurationTuple>();
    private webSocketSubject: WebSocketSubject<WebSocketData> | null = null;
    private selections = new Set<string>();
    private selectedSources = new Map<string, number>();

    public constructor(
        private readonly api: DashboardApiService,
        private readonly activeRoute: ActivatedRoute,
        private readonly translate: TranslateService,
        private readonly webServiceFactory: WebSocketFactoryService,
        private readonly dashboard: DashboardService,
        private readonly notify: NotifyService,
        private readonly toolbar: ToolbarService,
        private readonly commandHandler: CommandHandlerService,
        private readonly window: WindowService,
        private readonly clipboard: ClipboardService,
    ) {
        effect(() => {
            this.dashboard.activePage();
            if (!untracked(this.editMode)) {
                this.closeWebSocket();
                this.charts.forEach(item => item.chart.destroy());
                this.map.clear();
            }

            this.selections.clear();
            this.selectedSources.clear();
        });

        effect(() => {
            if (this.editMode()) {
                this.enterEditMode();
            } else {
                this.leafEditMode();
            }
        });
    }

    @ViewChildren('chart')
    public chartContainers: QueryList<ElementRef<HTMLCanvasElement>> | null = null;

    @ViewChild('dashboardToolbar', { read: TemplateRef })
    public dashboardToolbar: TemplateRef<unknown> | null = null;

    public readonly isEmpty = computed(() => this.dashboard.activePage().items.length === 0);

    public readonly activePage = this.dashboard.activePage;

    public readonly pages = this.dashboard.pages;

    public readonly editMode = this.dashboard.editMode;

    public readonly rows = computed(() =>
        this.dashboard.getGrid(this.dashboard.activePage()).map(rows => ({
            columns: rows.map(row => ({
                id: row.id,
                item: row,
                itemType: row.type,
            })),
        })),
    );

    public get selectedItem(): DashboardItem | null {
        if (this.selections.size === 1) {
            return this.findItem(this.selections.values().next().value!) ?? null;
        }

        return null;
    }

    public get selectedItems(): DashboardItem[] {
        const selectedItems: DashboardItem[] = [];
        for (const id of this.selections) {
            const item = this.findItem(id);
            if (item) {
                selectedItems.push(item);
            }
        }

        return selectedItems;
    }

    public readonly selectionMode = this.dashboard.selectionMode.asReadonly();

    public readonly canUndo = computed(() => this.editMode() && this.commandHandler.canUndo());

    public readonly canRedo = computed(() => this.editMode() && this.commandHandler.canRedo());

    public ngOnInit(): void {
        this.commandHandler.clear();

        let query: DashboardQuery | undefined;
        const params = this.activeRoute.snapshot.queryParams as DashboardQueryParams;
        if (params.format) {
            query = this.clipboard.get(params.format);
            if (query?.page) {
                this.dashboard.setPage(query.page);
            }
        }
    }

    public ngOnDestroy(): void {
        this.dashboard.save().subscribe();
        this.toolbar.clear();
        this.closeWebSocket();
        this.charts.forEach(item => item.chart.destroy());
    }

    public ngAfterViewInit(): void {
        if (this.dashboardToolbar) {
            this.toolbar.set(this.dashboardToolbar);
        }
    }

    public toggleSelection(column: DashboardColumn): void {
        if (this.selections.has(column.id)) {
            this.selections.delete(column.id);
        } else {
            if (this.selectionMode() === SelectionMode.Single) {
                this.selections.clear();
            }

            this.selections.add(column.id);
        }
    }

    public selected(column: DashboardColumn): boolean {
        return this.selections.has(column.id);
    }

    public getSources(column: DashboardColumn): string[] {
        const item = column.item;
        if (this.isChart(item)) {
            return item.sources.map(source => source.label);
        }

        return [];
    }

    public changeSource(column: DashboardColumn, label: string): void {
        const item = column.item;
        if (this.isChart(item)) {
            this.selectedSources.set(
                item.id,
                item.sources.findIndex(source => source.label === label),
            );
        }
    }

    public getChartType(column: DashboardColumn): DashboardChartType | undefined {
        const item = column.item;
        if (this.isChart(item)) {
            return item.chartType;
        }

        return undefined;
    }

    public addNew(): void {
        try {
            this.commandHandler.execute(new AddNewPageCommand(this.dashboard));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public rename(): void {
        try {
            const name = this.window.prompt(this.translate.instant('PROMPT_DASHBOARD_NAME'));
            if (name) {
                this.commandHandler.execute(new RenamePageCommand(this.dashboard, this.activePage(), name));
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public delete(): void {
        try {
            if (this.selectedItems.length > 0) {
                this.commandHandler.execute(
                    new DeleteItemCommand(this.dashboard, this.activePage(), this.selectedItems),
                );

                this.selectedItems.forEach(item => {
                    this.selections.delete(item.id);
                    this.selectedSources.delete(item.id);
                });
            } else {
                this.commandHandler.execute(new DeletePageCommand(this.dashboard, this.activePage()));
                this.selections.clear();
                this.selectedSources.clear();
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canMoveLeft(): boolean {
        const selectedItem = this.selectedItem;
        return this.editMode() && selectedItem != null && this.dashboard.canMoveLeft(this.activePage(), selectedItem);
    }

    public moveLeft(): void {
        try {
            this.commandHandler.execute(new MoveLeftCommand(this.dashboard, this.activePage(), this.selectedItem!));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canMoveRight(): boolean {
        const selectedItem = this.selectedItem;
        return this.editMode() && selectedItem != null && this.dashboard.canMoveRight(this.activePage(), selectedItem);
    }

    public moveRight(): void {
        try {
            this.commandHandler.execute(new MoveRightCommand(this.dashboard, this.activePage(), this.selectedItem!));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canMoveUp(): boolean {
        const selectedItem = this.selectedItem;
        return this.editMode() && selectedItem != null && this.dashboard.canMoveUp(this.activePage(), selectedItem);
    }

    public moveUp(): void {
        try {
            this.commandHandler.execute(new MoveUpCommand(this.dashboard, this.activePage(), this.selectedItem!));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canMoveDown(): boolean {
        const selectedItem = this.selectedItem;
        return this.editMode() && selectedItem != null && this.dashboard.canMoveDown(this.activePage(), selectedItem);
    }

    public moveDown(): void {
        try {
            this.commandHandler.execute(new MoveDownCommand(this.dashboard, this.activePage(), this.selectedItem!));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public setPage(page: DashboardPage): void {
        this.dashboard.setPage(page);
    }

    public getColor(column: DashboardColumn) {
        let color: string | undefined;

        try {
            const item = column.item;
            if (this.isChart(item)) {
                const value = item.sources[this.selectedSources.get(column.id) ?? 0].color;
                if (typeof value === 'string') {
                    color = value;
                }
            }
        } catch (error) {
            this.notify.log(LogType.Error, error);
        }

        return color ?? '#ffffff';
    }

    public changeColor(column: DashboardColumn, color: string): void {
        try {
            this.commandHandler.execute(
                new SetColorCommand(
                    this.dashboard,
                    this.activePage(),
                    column.item,
                    this.selectedSources.get(column.id) ?? 0,
                    color,
                ),
            );
        } catch (error) {
            this.notify.error(error);
        }
    }

    public changeChartType(column: DashboardColumn, value: string): void {
        try {
            this.commandHandler.execute(
                new SetChartTypeCommand(this.dashboard, this.activePage(), column.item, value as DashboardChartType),
            );
        } catch (error) {
            this.notify.error(error);
        }
    }

    public getMin(column: DashboardColumn): string {
        const item = column.item;
        if (this.isChart(item)) {
            return typeof item.min === 'number' && !Number.isNaN(item.min)
                ? convertToString(item.min, this.translate.currentLang)
                : '-';
        }

        return '-';
    }

    public changeMin(column: DashboardColumn, value: string): void {
        try {
            this.commandHandler.execute(
                new SetMinMaxCommand(
                    this.dashboard,
                    this.activePage(),
                    column.item as DashboardChart,
                    Number(value),
                    undefined,
                ),
            );
        } catch (error) {
            this.notify.error(error);
        }
    }

    public getMax(column: DashboardColumn): string {
        const item = column.item;
        if (this.isChart(item)) {
            return typeof item.max === 'number' && item.max && !Number.isNaN(item.max)
                ? convertToString(item.max, this.translate.currentLang)
                : '-';
        }

        return '-';
    }

    public changeMax(column: DashboardColumn, value: string): void {
        try {
            this.commandHandler.execute(
                new SetMinMaxCommand(
                    this.dashboard,
                    this.activePage(),
                    column.item as DashboardChart,
                    undefined,
                    Number(value),
                ),
            );
        } catch (error) {
            this.notify.error(error);
        }
    }

    public undo(): void {
        if (this.canUndo()) {
            this.commandHandler.undo();
        }
    }

    public redo(): void {
        if (this.canRedo()) {
            this.commandHandler.redo();
        }
    }

    private enterEditMode(): void {
        this.closeWebSocket();
        this.charts.forEach(item => item.chart.destroy());
        this.map.clear();
    }

    private leafEditMode(): void {
        setTimeout(() => {
            try {
                this.openWebSocket();
                if (this.chartContainers) {
                    this.createCharts(this.chartContainers);
                    if (this.webSocketSubject) {
                        for (const request of this.activePage().requests) {
                            this.webSocketSubject.next(this.createMessage(request));
                        }
                    }
                }
            } catch (error) {
                this.notify.error(error);
            }
        }, 0);
    }

    private findItem(id: string): DashboardItem | undefined {
        return this.activePage().items.find(item => item.id === id);
    }

    private openWebSocket(): void {
        const page = this.activePage();
        if (page && page.requests && page.requests.length > 0) {
            this.webSocketSubject = this.webServiceFactory.create();
            this.webSocketSubject.subscribe({
                next: this.socketOnMessage,
                error: this.socketOnError,
            });
        }
    }

    private closeWebSocket(): void {
        if (this.webSocketSubject) {
            this.webSocketSubject.unsubscribe();
            this.webSocketSubject = null;
        }
    }

    private createCharts(query: QueryList<ElementRef<HTMLCanvasElement>>): void {
        this.charts.clear();
        this.activePage().items.forEach(item => {
            if (this.isChart(item)) {
                const canvas = query.find(element => element.nativeElement.id === item.id);
                if (canvas) {
                    this.createChart(item, canvas.nativeElement);
                }
            }
        });
    }

    private createChart(item: DashboardChart, canvas: HTMLCanvasElement): void {
        let tuple = this.charts.get(item.id);
        switch (item.chartType) {
            case DashboardChartType.Line:
                tuple = this.createLineChart(item, canvas);
                break;
            case DashboardChartType.BarVertical:
                tuple = this.createVerticalBarChart(item, canvas);
                break;
            case DashboardChartType.BarHorizontal:
                tuple = this.createHorizontalBarChart(item, canvas);
                break;
            case DashboardChartType.TimeSeries:
                tuple = this.createTimeSeriesChart(item, canvas);
                break;
            default:
                throw new Error(`Chart type "${item.chartType}" is not supported.`);
        }

        this.charts.set(item.id, tuple);
    }

    private createLineChart(item: DashboardChart, canvas: HTMLCanvasElement): ChartConfigurationTuple {
        const configuration: ChartConfiguration<ChartType, number[], string> = {
            type: 'line',
            data: {
                labels: [],
                datasets: [],
            },
            options: {
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

    private createVerticalBarChart(item: DashboardChart, canvas: HTMLCanvasElement): ChartConfigurationTuple {
        const configuration: ChartConfiguration<ChartType, number[], string> = {
            type: 'bar',
            data: {
                labels: [item.label],
                datasets: [],
            },
            options: {
                indexAxis: 'x',
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

    private createHorizontalBarChart(item: DashboardChart, canvas: HTMLCanvasElement): ChartConfigurationTuple {
        const configuration: ChartConfiguration<ChartType, number[], string> = {
            type: 'bar',
            data: {
                labels: [item.label],
                datasets: [],
            },
            options: {
                indexAxis: 'y',
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

    private createTimeSeriesChart(item: DashboardChart, canvas: HTMLCanvasElement): ChartConfigurationTuple {
        const configuration: ChartConfiguration<ChartType, number[], string> = {
            type: 'line',
            data: {
                labels: [],
                datasets: [],
            },
            options: {
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
        this.api.getBlobValue(url).subscribe({
            next: value => {
                const timeSeries: TimeSeries = JSON.parse(window.atob(value));
                if (timeSeries.timestamp && timeSeries.value) {
                    const n = Math.min(timeSeries.value.length, timeSeries.timestamp.length);
                    for (let i = 0; i < n; i++) {
                        data.push(parseNumber(timeSeries.value[i]));
                        labels.push(timeSeries.timestamp[i]);
                    }
                }
            },
            error: error => this.notify.error(error),
        });
    }

    private createMessage(request: LiveRequest): WebSocketData {
        return {
            type: 'LiveRequest',
            data: request,
        };
    }

    private socketOnMessage = (data: WebSocketData): void => {
        if (data.type === 'LiveNode[]') {
            this.updateCharts(data.data as LiveNode[]);
        }
    };

    private socketOnError = (error: unknown): void => {
        this.notify.error(error);
    };

    private updateCharts(nodes: LiveNode[]): void {
        for (const node of nodes) {
            const tuple = this.map.get(node.nodeId);
            if (tuple) {
                switch (tuple.item.chartType) {
                    case DashboardChartType.Line:
                        this.updateLineChart(tuple.item, tuple.dataset, node);
                        break;
                    case DashboardChartType.BarHorizontal:
                    case DashboardChartType.BarVertical:
                        this.updateBarChart(tuple.item, tuple.dataset, node);
                        break;
                }
            }
        }
    }

    private updateLineChart(item: DashboardChart, dataset: ChartDataset, node: LiveNode) {
        const tuple = this.charts.get(item.id);
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

    private updateBarChart(item: DashboardChart, dataset: ChartDataset, node: LiveNode) {
        const tuple = this.charts.get(item.id);
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

    private isBigInt(y: unknown): y is number[] {
        return Array.isArray(y) && y.length === 2 && isNumber(y[0]) && isNumber(y[1]);
    }

    private toNumber(value: number[]): number {
        return value[0] === 0 ? value[1] : value[0] * 4294967296 + value[1];
    }

    private isChart(value?: DashboardItem | null): value is DashboardChart {
        return value?.type === DashboardItemType.Chart;
    }
}
