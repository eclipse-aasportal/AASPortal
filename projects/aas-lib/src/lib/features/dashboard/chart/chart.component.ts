/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, effect, ElementRef, inject, input, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateDirective } from '@ngx-translate/core';

import { LiveNode, LiveRequest, WebSocketData } from 'aas-core';
import { Dashboard } from '../dashboard';
import { DashboardApiService } from '../dashboard-api.service';
import { ChartConfigurationTuple, DashboardChart } from '../dashboard-types';
import { WebSocketService } from '../../../shared/services/web-socket.service';

@Component({
    selector: 'fhg-chart',
    templateUrl: './chart.component.html',
    styleUrl: './chart.component.scss',
    standalone: true,
    imports: [TranslateDirective],
})
export class ChartComponent extends Dashboard {
    private configuration?: ChartConfigurationTuple;
    private webSocketSubscription?: Subscription;
    private readonly webSocket = inject(WebSocketService);

    public constructor() {
        super(inject(DashboardApiService));

        effect(() => {
            const chart = this.chart();
            const requests = this.requests();
            if (this.configuration) {
                this.leaveLiveMode();
            }

            if (chart) {
                this.enterLiveMode(chart, requests);
            }
        });
    }

    public readonly chartContainer = viewChild<ElementRef<HTMLCanvasElement>>('chart');

    public readonly chart = input<DashboardChart>();

    public readonly requests = input<LiveRequest[]>([]);

    public readonly page = input('');

    public readonly href = input('');

    private enterLiveMode(chart: DashboardChart, requests: LiveRequest[]): void {
        if (this.configuration) {
            return;
        }

        setTimeout(() => {
            try {
                this.openWebSocket();
                const chartContainer = this.chartContainer();
                if (chartContainer) {
                    this.configuration = this.createChart(chart, chartContainer.nativeElement);
                    if (this.webSocketSubscription) {
                        for (const request of requests) {
                            this.webSocket.sendMessage(this.createMessage(request));
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }, 0);
    }

    private leaveLiveMode(): void {
        if (!this.configuration) {
            return;
        }

        this.closeWebSocket();
        this.configuration.chart.destroy();
        this.map.clear();
        this.configuration = undefined;
    }

    private openWebSocket(): void {
        this.webSocketSubscription = this.webSocket.getMessages().subscribe({
            next: this.socketOnMessage,
            error: this.socketOnError,
        });
    }

    private closeWebSocket(): void {
        if (this.webSocketSubscription) {
            this.webSocketSubscription.unsubscribe();
            this.webSocketSubscription = undefined;
        }
    }

    private socketOnMessage = (data: WebSocketData): void => {
        if (!this.configuration) {
            return;
        }

        if (data.type === 'LiveNode[]') {
            for (const node of data.data as LiveNode[]) {
                const tuple = this.map.get(node.nodeId);
                if (!tuple) {
                    continue;
                }

                this.updateChart(node, tuple, this.configuration);
            }
        }
    };

    private socketOnError = (error: unknown): void => {
        console.error(error);
    };
}
