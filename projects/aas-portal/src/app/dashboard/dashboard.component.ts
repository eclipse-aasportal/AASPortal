/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'chart.js/auto';
import { WebSocketSubject } from 'rxjs/webSocket';
import { EMPTY, first, Observable } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
    Inject,
    signal,
} from '@angular/core';

import { convertToString, LiveNode, WebSocketData } from 'aas-core';
import { LogType, NotifyService, StartService, ToolbarService, WebSocketFactoryService, WINDOW } from 'aas-lib';

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
import { Dashboard } from './dashboard';
import { DashboardService } from './dashboard.service';
import {
    ChartConfigurationTuple,
    DashboardChart,
    DashboardChartType,
    DashboardColumn,
    DashboardItem,
    DashboardPage,
} from './dashboard-types';

@Component({
    selector: 'fhg-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    imports: [NgClass, FormsModule, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent extends Dashboard implements OnInit, OnDestroy {
    private readonly charts = new Map<string, ChartConfigurationTuple>();
    private readonly selections = signal<string[]>([]);
    private webSocketSubject: WebSocketSubject<WebSocketData> | null = null;
    private selectedSources = new Map<string, number>();
    private live = false;

    public constructor(
        api: DashboardApiService,
        private readonly service: DashboardService,
        private readonly activeRoute: ActivatedRoute,
        private readonly translate: TranslateService,
        private readonly webServiceFactory: WebSocketFactoryService,
        private readonly notify: NotifyService,
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
        private readonly commandHandler: CommandHandlerService,
        @Inject(WINDOW) private readonly window: Window,
    ) {
        super(api);

        effect(() => {
            this.activePage();
            if (!this.service.editMode()) {
                this.leaveLiveMode();
            }

            this.selections.set([]);
            this.selectedSources.clear();
            if (!this.service.editMode()) {
                this.enterLiveMode();
            }
        });

        effect(() => {
            this.editMode() ? this.leaveLiveMode() : this.enterLiveMode();
        });

        effect(() => {
            const template = this.toolbarTemplate();
            if (template !== undefined) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly chartContainers = viewChildren<ElementRef<HTMLCanvasElement>>('chart');

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('dashboardToolbar');

    public readonly isEmpty = computed(() => this.activePage().items.length === 0);

    public readonly activePage = this.service.activePage;

    public readonly pages = this.service.pages;

    public readonly editMode = this.service.editMode;

    public readonly rows = this.service.rows;

    public readonly selectedItem = computed(() => {
        if (this.selections().length === 1) {
            return this.findItem(this.selections()[0]);
        }

        return null;
    });

    public readonly selectedItems = computed(() => {
        const selectedItems: DashboardItem[] = [];
        for (const id of this.selections()) {
            const item = this.findItem(id);
            if (item) {
                selectedItems.push(item);
            }
        }

        return selectedItems;
    });

    public readonly canUndo = computed(() => this.editMode() && this.commandHandler.canUndo());

    public readonly canRedo = computed(() => this.editMode() && this.commandHandler.canRedo());

    public ngOnInit(): void {
        this.commandHandler.clear();

        this.activeRoute.queryParams.pipe(first()).subscribe(params => {
            if (params.page) {
                this.setActivePage(params.page);
            }
        });
    }

    public ngOnDestroy(): void {
        this.service.save().subscribe();
        this.toolbar.clear();
        this.leaveLiveMode();
    }

    public setActivePage(arg: DashboardPage | string): void {
        const name = (typeof arg === 'string') ? arg : arg.name;
        this.service.setActivePage(name);
    }

    public toggleSelection(column: DashboardColumn, $event?: MouseEvent): void {
        if (this.selections().indexOf(column.id) >= 0) {
            this.selections.update(state => state.filter(item => item !== column.id));
        } else {
            this.selections.set([column.id]);
        }
    }

    public isSelected(column: DashboardColumn): boolean {
        return this.selections().indexOf(column.id) >= 0;
    }

    public getSources(column: DashboardColumn): string[] {
        const item = column.item;
        if (this.isDashboardChart(item)) {
            return item.sources.map(source => source.label);
        }

        return [];
    }

    public changeSource(column: DashboardColumn, label: string): void {
        const item = column.item;
        if (this.isDashboardChart(item)) {
            this.selectedSources.set(
                item.id,
                item.sources.findIndex(source => source.label === label),
            );
        }
    }

    public getChartType(column: DashboardColumn): DashboardChartType | undefined {
        const item = column.item;
        if (this.isDashboardChart(item)) {
            return item.chartType;
        }

        return undefined;
    }

    public addNew(): void {
        try {
            this.commandHandler.execute(new AddNewPageCommand(this.service));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public rename(): void {
        try {
            const name = this.window.prompt(this.translate.instant('Dashboard.PROMPT_DASHBOARD_NAME'));
            if (name) {
                this.commandHandler.execute(new RenamePageCommand(this.service, this.activePage(), name));
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public delete(): void {
        try {
            if (this.selectedItems().length > 0) {
                this.commandHandler.execute(
                    new DeleteItemCommand(this.service, this.activePage(), this.selectedItems()),
                );

                this.selectedItems().forEach(item => {
                    this.selections.update(state => state.filter(value => value !== item.id));
                    this.selectedSources.delete(item.id);
                });
            } else {
                this.commandHandler.execute(new DeletePageCommand(this.service, this.activePage()));
                this.selections.set([]);
                this.selectedSources.clear();
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canMoveLeft(): boolean {
        const selectedItem = this.selectedItem();
        return this.editMode() && selectedItem != null && this.service.canMoveLeft(this.activePage(), selectedItem);
    }

    public moveLeft(): void {
        try {
            this.commandHandler.execute(new MoveLeftCommand(this.service, this.activePage(), this.selectedItem()!));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canMoveRight(): boolean {
        const selectedItem = this.selectedItem();
        return this.editMode() && selectedItem != null && this.service.canMoveRight(this.activePage(), selectedItem);
    }

    public moveRight(): void {
        try {
            this.commandHandler.execute(new MoveRightCommand(this.service, this.activePage(), this.selectedItem()!));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canMoveUp(): boolean {
        const selectedItem = this.selectedItem();
        return this.editMode() && selectedItem != null && this.service.canMoveUp(this.activePage(), selectedItem);
    }

    public moveUp(): void {
        try {
            this.commandHandler.execute(new MoveUpCommand(this.service, this.activePage(), this.selectedItem()!));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canMoveDown(): boolean {
        const selectedItem = this.selectedItem();
        return this.editMode() && selectedItem != null && this.service.canMoveDown(this.activePage(), selectedItem);
    }

    public moveDown(): void {
        try {
            this.commandHandler.execute(new MoveDownCommand(this.service, this.activePage(), this.selectedItem()!));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public getColor(column: DashboardColumn) {
        let color: string | undefined;

        try {
            const item = column.item;
            if (this.isDashboardChart(item)) {
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
                    this.service,
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
                new SetChartTypeCommand(this.service, this.activePage(), column.item, value as DashboardChartType),
            );
        } catch (error) {
            this.notify.error(error);
        }
    }

    public getMin(column: DashboardColumn): string {
        const item = column.item;
        if (this.isDashboardChart(item)) {
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
                    this.service,
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
        if (this.isDashboardChart(item)) {
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
                    this.service,
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

    public addToStart(): Observable<void> {
        for (const item of this.selectedItems()) {
            if (this.isDashboardChart(item)) {
                if (!this.start.add('Dashboard', `DB.${item.id}`, { chart: item })) {
                    return EMPTY;
                }
            }
        }

        return this.start.save();
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

    private createCharts(query: ReadonlyArray<ElementRef<HTMLCanvasElement>>): void {
        this.charts.clear();
        this.activePage().items.forEach(item => {
            if (this.isDashboardChart(item)) {
                const canvas = query.find(element => element.nativeElement.id === item.id);
                if (canvas) {
                    this.charts.set(item.id, this.createChart(item, canvas.nativeElement));
                }
            }
        });
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
            if (!tuple) {
                continue;
            }

            const cfg = this.charts.get(tuple.item.id);
            if (!cfg) {
                continue;
            }

            this.updateChart(node, tuple, cfg);
        }
    }
}
