/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { cloneDeep } from 'lodash-es';
import { DashboardCommand } from './dashboard-command';
import {
    DashboardChart,
    DashboardChartType,
    DashboardItem,
    DashboardPage,
    DashboardService,
} from '../dashboard.service';

export class SetChartTypeCommand extends DashboardCommand {
    public constructor(
        dashboard: DashboardService,
        private page: DashboardPage,
        private item: DashboardItem,
        private chartType: DashboardChartType,
    ) {
        super('Set chart type', dashboard);
    }

    protected executing(): void {
        const page = cloneDeep(this.page);
        const item = page.items[this.page.items.indexOf(this.item)] as DashboardChart;

        if (this.isChart(item)) {
            item.chartType = this.chartType;
            this.dashboard.update(page);
        } else {
            throw new Error('Not implemented.');
        }
    }
}
