/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, effect, ElementRef, input, viewChild } from '@angular/core';
import { WebSocketSubject } from 'rxjs/webSocket';

import { LiveNode, LiveRequest, WebSocketData } from 'aas-core';
import { Dashboard } from '../dashboard';
import { DashboardApiService } from '../dashboard-api.service';
import { WebSocketFactoryService } from 'aas-lib';
import { ChartConfigurationTuple, DashboardChart } from '../dashboard-types';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'fhg-chart',
    templateUrl: './chart.component.html',
    styleUrl: './chart.component.scss',
    standalone: true,
    imports: [TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent extends Dashboard {
    private configuration?: ChartConfigurationTuple;
    private webSocketSubject: WebSocketSubject<WebSocketData> | null = null;

    public constructor(
        api: DashboardApiService,
        private readonly webServiceFactory: WebSocketFactoryService,
    ) {
        super(api);

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
                    if (this.webSocketSubject) {
                        for (const request of requests) {
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
        if (!this.configuration) {
            return;
        }

        this.closeWebSocket();
        this.configuration.chart.destroy();
        this.map.clear();
        this.configuration = undefined;
    }

    private openWebSocket(): void {
        this.webSocketSubject = this.webServiceFactory.create();
        this.webSocketSubject.subscribe({
            next: this.socketOnMessage,
            error: this.socketOnError,
        });
    }

    private closeWebSocket(): void {
        if (this.webSocketSubject) {
            this.webSocketSubject.unsubscribe();
            this.webSocketSubject = null;
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
