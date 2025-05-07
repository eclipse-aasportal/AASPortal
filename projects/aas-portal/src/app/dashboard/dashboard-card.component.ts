/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, effect, ElementRef, input, viewChild } from '@angular/core';
import { WebSocketSubject } from 'rxjs/webSocket';

import { LiveNode, WebSocketData } from 'aas-core';
import { Dashboard } from './dashboard';
import { DashboardApiService } from './dashboard-api.service';
import { WebSocketFactoryService } from 'aas-lib';
import { ChartConfigurationTuple, DashboardCard } from './dashboard-types';

@Component({
    selector: 'fhg-dashboard-card',
    templateUrl: './dashboard-card.component.html',
    styleUrl: './dashboard-card.component.scss',
    standalone: true,
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCardComponent extends Dashboard {
    private chart?: [string, ChartConfigurationTuple];
    private webSocketSubject: WebSocketSubject<WebSocketData> | null = null;

    public constructor(
        api: DashboardApiService,
        private readonly webServiceFactory: WebSocketFactoryService,
    ) {
        super(api);

        effect(() => {
            const item = this.item();
            item ? this.enterLiveMode(item) : this.leaveLiveMode();
        });
    }

    public readonly chartContainer = viewChild<ElementRef<HTMLCanvasElement>>('chartContainer');

    public readonly item = input<DashboardCard>();

    private enterLiveMode(item: DashboardCard): void {
        if (this.chart) {
            return;
        }

        setTimeout(() => {
            try {
                this.openWebSocket();
                const chartContainer = this.chartContainer();
                if (chartContainer && this.isChart(item.item)) {
                    this.chart = [item.item.id, this.createChart(item.item, chartContainer.nativeElement)]
                    if (this.webSocketSubject) {
                        for (const request of item.requests) {
                            this.webSocketSubject.next(this.createMessage(request));
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }, 0);
    }

    private leaveLiveMode(): void {
        if (!this.chart) {
            return;
        }

        this.closeWebSocket();
        this.chart[1].chart.destroy();
        this.map.clear();
        this.chart = undefined;
    }

    private openWebSocket(): void {
        const item = this.item();
        if (item && item.requests && item.requests.length > 0) {
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

    private socketOnMessage = (data: WebSocketData): void => {
        if (!this.chart){
            return;
        }

        if (data.type === 'LiveNode[]') {
            for (const node of (data.data as LiveNode[])) {
                const tuple = this.map.get(node.nodeId);
                if (!tuple) {
                    continue;
                }

                this.updateChart(node, tuple, this.chart[1]);
            }
        }
    };

    private socketOnError = (error: unknown): void => {
        console.error(error);
    };
}
