/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, input, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { convertToString } from 'aas-core';
import { NotifyService, CommandHandler } from 'aas-lib';
import { DashboardChartItem, DashboardChartType } from '../dashboard-types';
import { SetColorCommand } from '../commands/set-color-command';
import { SetMinMaxCommand } from '../commands/set-min-max-command';
import { DashboardService } from '../dashboard.service';
import { SetChartTypeCommand } from '../commands/set-chart-type-command';

@Component({
    selector: 'fhg-chart-edit',
    imports: [FormsModule, TranslateModule],
    templateUrl: './chart-edit.component.html',
    styleUrl: './chart-edit.component.scss',
})
export class ChartEditComponent {
    public constructor(
        private readonly commandHandler: CommandHandler,
        private readonly notify: NotifyService,
        private readonly translate: TranslateService,
        private readonly service: DashboardService,
    ) {}

    public readonly chartTypes = signal<DashboardChartType[]>([
        DashboardChartType.Line,
        DashboardChartType.BarVertical,
        DashboardChartType.BarHorizontal,
    ]).asReadonly();

    public readonly item = input.required<DashboardChartItem>();

    public getColor(chart: DashboardChartItem): string {
        const label = chart.source();
        return chart.sources.find(source => source.label === label)?.color ?? '0xffffff';
    }

    public changeColor(chart: DashboardChartItem, color: string): void {
        try {
            this.commandHandler.execute(new SetColorCommand(this.service, this.service.activePage(), chart, color));
        } catch (error) {
            this.notify.error(error);
        }
    }

    public changeChartType(chart: DashboardChartItem, value: string): void {
        try {
            this.commandHandler.execute(
                new SetChartTypeCommand(this.service, this.service.activePage(), chart, value as DashboardChartType),
            );
        } catch (error) {
            this.notify.error(error);
        }
    }

    public getMin(chart: DashboardChartItem): string {
        return typeof chart.min === 'number' && !Number.isNaN(chart.min)
            ? convertToString(chart.min, this.translate.currentLang)
            : '-';
    }

    public changeMin(chart: DashboardChartItem, value: string): void {
        try {
            this.commandHandler.execute(
                new SetMinMaxCommand(this.service, this.service.activePage(), chart, Number(value), undefined),
            );
        } catch (error) {
            this.notify.error(error);
        }
    }

    public getMax(chart: DashboardChartItem): string {
        return typeof chart.max === 'number' && chart.max && !Number.isNaN(chart.max)
            ? convertToString(chart.max, this.translate.currentLang)
            : '-';
    }

    public changeMax(chart: DashboardChartItem, value: string): void {
        try {
            this.commandHandler.execute(
                new SetMinMaxCommand(this.service, this.service.activePage(), chart, undefined, Number(value)),
            );
        } catch (error) {
            this.notify.error(error);
        }
    }
}
