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
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    TemplateRef,
    computed,
    effect,
    ChangeDetectionStrategy,
    viewChild,
    viewChildren,
    signal,
} from '@angular/core';

import isNumber from 'lodash-es/isNumber';
import { Chart, ChartConfiguration, ChartDataset, ChartType } from 'chart.js';
import { first } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { aas, convertToString, LiveNode, LiveRequest, parseNumber, WebSocketData } from 'aas-core';
import { LogType, NotifyService, WebSocketFactoryService, WindowService } from 'aas-lib';

import { SelectionMode } from '../types/selection-mode';
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
import { DashboardApiService } from './dashboard-api.service';
import { ToolbarService } from '../toolbar.service';
import {
    DashboardChart,
    DashboardChartType,
    DashboardColumn,
    DashboardItem,
    DashboardItemType,
    DashboardStore,
} from './dashboard.store';

type UpdateTuple = {
    item: DashboardChart;
    dataset: ChartDataset;
};

type ChartConfigurationTuple = {
    chart: Chart;
    configuration: ChartConfiguration;
};

type TimeSeries = {
    value: string[];
    timestamp: string[];
};

@Component({
    selector: 'fhg-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: true,
    imports: [NgClass, FormsModule, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
    private readonly map = new Map<string, UpdateTuple>();
    private readonly charts = new Map<string, ChartConfigurationTuple>();
    private webSocketSubject: WebSocketSubject<WebSocketData> | null = null;
    private selections = new Set<string>();
    private selectedSources = new Map<string, number>();
    private live = false;

    public constructor(
        private readonly api: DashboardApiService,
        private readonly store: DashboardStore,
        private readonly activeRoute: ActivatedRoute,
        private readonly translate: TranslateService,
        private readonly webServiceFactory: WebSocketFactoryService,
        private readonly notify: NotifyService,
        private readonly toolbar: ToolbarService,
        private readonly commandHandler: CommandHandlerService,
        private readonly window: WindowService,
    ) {
        effect(
            () => {
                const activePage = this.store.activePage$();
                if (!this.store.editMode) {
                    this.leaveLiveMode();
                }

                this.selections.clear();
                this.selectedSources.clear();
                this.activePage.set(activePage.name);

                if (!this.store.editMode) {
                    this.enterLiveMode();
                }
            },
            { allowSignalWrites: true },
        );

        effect(
            () => {
                const value = this.activePage();
                if (value !== this.store.activePage.name) {
                    this.store.setActivePage(value);
                }
            },
            { allowSignalWrites: true },
        );

        effect(
            () => {
                if (this.editMode()) {
                    this.leaveLiveMode();
                } else {
                    this.enterLiveMode();
                }
            },
            { allowSignalWrites: true },
        );

        effect(
            () => {
                const name = this.activePage();
                const index = this.store.pages.findIndex(page => page.name === name);
                if (this.store.index !== index) {
                    this.store.updateState(state => ({ ...state, index }));
                }
            },
            { allowSignalWrites: true },
        );

        effect(
            () => {
                const dashboardToolbar = this.dashboardToolbar();
                if (dashboardToolbar !== undefined) {
                    this.toolbar.set(dashboardToolbar);
                }
            },
            { allowSignalWrites: true },
        );
    }

    public readonly chartContainers = viewChildren<ElementRef<HTMLCanvasElement>>('chart');

    public readonly dashboardToolbar = viewChild<TemplateRef<unknown>>('dashboardToolbar');

    public readonly isEmpty = computed(() => this.store.activePage$().items.length === 0);

    public readonly activePage = signal(this.store.activePage$().name);

    public readonly pages = computed(() => {
        return this.store.pages$().map(page => page.name);
    });

    public readonly editMode = this.store.editMode$;

    public readonly rows = this.store.rows$;

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

    public readonly selectionMode = this.store.selectionMode$.asReadonly();

    public readonly canUndo = computed(() => this.editMode() && this.commandHandler.canUndo());

    public readonly canRedo = computed(() => this.editMode() && this.commandHandler.canRedo());

    public ngOnInit(): void {
        this.commandHandler.clear();

        this.activeRoute.queryParams.pipe(first()).subscribe(params => {
            if (params.page) {
                this.activePage.set(params.page);
            }
        });
    }

    public ngOnDestroy(): void {
        this.store.save().subscribe();
        this.toolbar.clear();
        this.leaveLiveMode();
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
            this.commandHandler.execute(new AddNewPageCommand(this.store));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public rename(): void {
        try {
            const name = this.window.prompt(this.translate.instant('PROMPT_DASHBOARD_NAME'));
            if (name) {
                this.commandHandler.execute(new RenamePageCommand(this.store, this.store.activePage, name));
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public delete(): void {
        try {
            if (this.selectedItems.length > 0) {
                this.commandHandler.execute(
                    new DeleteItemCommand(this.store, this.store.activePage, this.selectedItems),
                );

                this.selectedItems.forEach(item => {
                    this.selections.delete(item.id);
                    this.selectedSources.delete(item.id);
                });
            } else {
                this.commandHandler.execute(new DeletePageCommand(this.store, this.store.activePage));
                this.selections.clear();
                this.selectedSources.clear();
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canMoveLeft(): boolean {
        const selectedItem = this.selectedItem;
        return this.editMode() && selectedItem != null && this.store.canMoveLeft(this.store.activePage, selectedItem);
    }

    public moveLeft(): void {
        try {
            this.commandHandler.execute(new MoveLeftCommand(this.store, this.store.activePage, this.selectedItem!));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canMoveRight(): boolean {
        const selectedItem = this.selectedItem;
        return this.editMode() && selectedItem != null && this.store.canMoveRight(this.store.activePage, selectedItem);
    }

    public moveRight(): void {
        try {
            this.commandHandler.execute(new MoveRightCommand(this.store, this.store.activePage, this.selectedItem!));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canMoveUp(): boolean {
        const selectedItem = this.selectedItem;
        return this.editMode() && selectedItem != null && this.store.canMoveUp(this.store.activePage, selectedItem);
    }

    public moveUp(): void {
        try {
            this.commandHandler.execute(new MoveUpCommand(this.store, this.store.activePage, this.selectedItem!));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canMoveDown(): boolean {
        const selectedItem = this.selectedItem;
        return this.editMode() && selectedItem != null && this.store.canMoveDown(this.store.activePage, selectedItem);
    }

    public moveDown(): void {
        try {
            this.commandHandler.execute(new MoveDownCommand(this.store, this.store.activePage, this.selectedItem!));
        } catch (error) {
            this.notify.error(error);
        }
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
                    this.store,
                    this.store.activePage,
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
                new SetChartTypeCommand(this.store, this.store.activePage, column.item, value as DashboardChartType),
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
                    this.store,
                    this.store.activePage,
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
                    this.store,
                    this.store.activePage,
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

    private leaveLiveMode(): void {
        if (!this.live) {
            return;
        }

        this.closeWebSocket();
        this.charts.forEach(item => item.chart.destroy());
        this.map.clear();
        this.live = false;
    }

    private enterLiveMode(): void {
        if (this.live) {
            return;
        }

        this.live = true;
        setTimeout(() => {
            try {
                this.openWebSocket();
                const chartContainers = this.chartContainers();
                if (chartContainers) {
                    this.createCharts(chartContainers);
                    if (this.webSocketSubject) {
                        for (const request of this.store.activePage.requests) {
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
        return this.store.activePage.items.find(item => item.id === id);
    }

    private openWebSocket(): void {
        const page = this.store.activePage;
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

    private createCharts(query: ReadonlyArray<ElementRef<HTMLCanvasElement>>): void {
        this.charts.clear();
        this.store.activePage.items.forEach(item => {
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

    private createVerticalBarChart(item: DashboardChart, canvas: HTMLCanvasElement): ChartConfigurationTuple {
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

    private createHorizontalBarChart(item: DashboardChart, canvas: HTMLCanvasElement): ChartConfigurationTuple {
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

    private createTimeSeriesChart(item: DashboardChart, canvas: HTMLCanvasElement): ChartConfigurationTuple {
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
