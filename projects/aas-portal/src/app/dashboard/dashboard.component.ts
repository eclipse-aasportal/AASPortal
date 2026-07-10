/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'chart.js/auto';
import { EMPTY, first, Observable, Subscription } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
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
    inject,
} from '@angular/core';

import { LiveNode, LiveRequest, WebSocketData } from 'aas-core';
import {
    CommandHandler,
    NotifyService,
    PromptDialog,
    StartService,
    ToolbarService,
    WebSocketService,
    WINDOW,
} from 'aas-lib';

import { MovePreviousCommand } from './commands/move-previous-command';
import { MoveNextCommand } from './commands/move-next-command';
import { DeletePageCommand } from './commands/delete-page-command';
import { RenamePageCommand } from './commands/rename-page-command';
import { AddNewPageCommand } from './commands/add-new-page-command';
import { DeleteItemCommand } from './commands/delete-item-command';
import { DashboardApiService } from './dashboard-api.service';
import { Dashboard } from './dashboard';
import { DashboardService } from './dashboard.service';
import { ChartEditComponent } from './chart-edit/chart-edit.component';
import {
    ChartConfigurationTuple,
    DashboardChart,
    DashboardChartItem,
    DashboardPage,
    DashboardSource,
    ViewPortSize,
} from './dashboard-types';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'fhg-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    imports: [FormsModule, TranslatePipe, ChartEditComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent extends Dashboard implements OnInit, OnDestroy {
    @Inject(WINDOW) private readonly window = inject(WINDOW);
    private readonly service = inject(DashboardService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly translate = inject(TranslateService);
    private readonly webSocket = inject(WebSocketService);
    private readonly notify = inject(NotifyService);
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);
    private readonly modal = inject(NgbModal);
    private readonly commandHandler = inject(CommandHandler);
    private readonly charts = new Map<string, ChartConfigurationTuple>();
    private webSocketSubscription?: Subscription;
    private live = false;

    public constructor() {
        super(inject(DashboardApiService));

        window.addEventListener('resize', this.updateViewPortSize);

        effect(() => {
            this.activePage();
            if (!this.service.editMode()) {
                this.leaveLiveMode();
            }

            if (!this.service.editMode()) {
                this.enterLiveMode();
            }
        });

        effect(() => {
            if (this.editMode()) {
                this.leaveLiveMode();
            } else {
                this.enterLiveMode();
            }
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

    public readonly firstItems = computed(() => {
        const items = this.activePage().items;
        return items.slice(0, items.length % this.viewPortSize());
    });

    public readonly items = computed(() => {
        const items = this.activePage().items;
        return items.slice(items.length % this.viewPortSize());
    });

    public readonly viewPortSize = signal<ViewPortSize>(this.getViewPortSize());

    public readonly selectedItem = computed(() => {
        const values = this.activePage().items.filter(item => item.selected());
        return values.length === 1 ? values[0] : undefined;
    });

    public readonly selectedItems = computed(() => {
        return this.activePage().items.filter(item => item.selected());
    });

    public readonly canUndo = computed(() => this.editMode() && this.commandHandler.canUndo());

    public readonly canRedo = computed(() => this.editMode() && this.commandHandler.canRedo());

    public readonly canMoveNext = computed(() => {
        const selectedItem = this.selectedItem();
        const items = this.activePage().items;
        if (!this.editMode() || !selectedItem) {
            return false;
        }

        return items.indexOf(selectedItem) < items.length - 1;
    });

    public readonly canMovePrevious = computed(() => {
        const selectedItem = this.selectedItem();
        const items = this.activePage().items;
        if (!this.editMode() || !selectedItem) {
            return false;
        }

        return items.indexOf(selectedItem) > 0;
    });

    public ngOnInit(): void {
        this.commandHandler.clear();
        this.activeRoute.queryParams.pipe(first()).subscribe(params => {
            if (params.page) {
                this.setActivePage(params.page);
            }
        });
    }

    public ngOnDestroy(): void {
        this.window.removeEventListener('resize', this.updateViewPortSize);
        this.service.save().subscribe();
        this.toolbar.clear();
        this.leaveLiveMode();
    }

    public setActivePage(arg: DashboardPage | string): void {
        const name = typeof arg === 'string' ? arg : arg.name;
        this.service.setActivePage(name);
    }

    public toggleSelection($event: Event | undefined, chart: DashboardChartItem): void {
        const page = this.activePage();
        page.items.forEach(item => {
            if (item === chart) {
                item.selected.update(state => !state);
            } else if (item.selected()) {
                item.selected.set(false);
            }
        });
    }

    public addNew(): void {
        try {
            this.commandHandler.execute(new AddNewPageCommand(this.service));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public async rename(): Promise<void> {
        try {
            const name = await PromptDialog.open(this.modal, this.translate.instant('Dashboard.PROMPT_DASHBOARD_NAME'));
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
            } else {
                this.commandHandler.execute(new DeletePageCommand(this.service, this.activePage()));
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public moveNext(): void {
        try {
            const item = this.selectedItem();
            if (!item) {
                return;
            }

            this.commandHandler.execute(new MoveNextCommand(this.service, this.activePage(), item));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public movePrevious(): void {
        try {
            const item = this.selectedItem();
            if (!item) {
                return;
            }

            this.commandHandler.execute(new MovePreviousCommand(this.service, this.activePage(), item));
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
            if (
                !this.start.add('Chart', `DB.${item.id}`, {
                    chart: {
                        id: item.id,
                        label: item.label,
                        chartType: item.chartType(),
                        min: item.min,
                        max: item.max,
                        sources: [...item.sources],
                    } satisfies DashboardChart,
                    requests: this.getRequests(item.sources),
                    page: this.service.activePage().name,
                    href: `/dashboard;page=${this.service.activePage().name}`,
                })
            ) {
                return EMPTY;
            }
        }

        return this.start.save();
    }

    private getRequests(sources: DashboardSource[]): LiveRequest[] {
        const results: LiveRequest[] = [];
        for (const request of this.activePage().requests) {
            let result: LiveRequest | undefined;
            for (const node of request.nodes) {
                for (const source of sources) {
                    if (source.node?.nodeId === node.nodeId) {
                        if (!result) {
                            result = { ...request, nodes: [] };
                        }

                        result.nodes.push({ ...node });
                        break;
                    }
                }
            }

            if (result) {
                results.push(result);
            }
        }

        return results;
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
                    if (this.webSocketSubscription) {
                        for (const request of this.activePage().requests) {
                            this.webSocket.sendMessage(this.createMessage(request));
                        }
                    }
                }
            } catch (error) {
                this.notify.error(error);
            }
        }, 0);
    }

    private openWebSocket(): void {
        const page = this.activePage();
        if (page && page.requests && page.requests.length > 0) {
            this.webSocketSubscription = this.webSocket.getMessages().subscribe({
                next: this.socketOnMessage,
                error: this.socketOnError,
            });
        }
    }

    private closeWebSocket(): void {
        if (this.webSocketSubscription) {
            this.webSocketSubscription.unsubscribe();
            this.webSocketSubscription = undefined;
        }
    }

    private createCharts(query: ReadonlyArray<ElementRef<HTMLCanvasElement>>): void {
        this.charts.clear();
        this.activePage().items.forEach(item => {
            const canvas = query.find(element => element.nativeElement.id === item.id);
            if (canvas) {
                this.charts.set(
                    item.id,
                    this.createChart(
                        {
                            id: item.id,
                            label: item.label,
                            chartType: item.chartType(),
                            min: item.min,
                            max: item.max,
                            sources: [...item.sources],
                        },
                        canvas.nativeElement,
                    ),
                );
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

            const cfg = this.charts.get(tuple.chart.id);
            if (!cfg) {
                continue;
            }

            this.updateChart(node, tuple, cfg);
        }
    }

    private getViewPortSize(): ViewPortSize {
        const width = this.window.innerWidth;
        if (width < 576) {
            return ViewPortSize.xs;
        }

        if (width < 768) {
            return ViewPortSize.sm;
        }

        if (width < 992) {
            return ViewPortSize.md;
        }

        return ViewPortSize.lg;
    }

    private readonly updateViewPortSize = (): void => {
        this.viewPortSize.set(this.getViewPortSize());
    };
}
