/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { DashboardCommand } from './dashboard-command';
import { DashboardService } from '../dashboard.service';
import { DashboardChart, DashboardChartType, DashboardItem, DashboardPage } from '../dashboard-types';

export class SetChartTypeCommand extends DashboardCommand {
    public constructor(
        service: DashboardService,
        private page: DashboardPage,
        private item: DashboardItem,
        private chartType: DashboardChartType,
    ) {
        super('Set chart type', service);
    }

    protected executing(): void {
        const page = cloneDeep(this.page);
        const item = page.items[this.page.items.indexOf(this.item)] as DashboardChart;

        if (this.isChart(item)) {
            item.chartType = this.chartType;
            this.service.updatePage(page);
        } else {
            throw new Error('Not implemented.');
        }
    }
}
