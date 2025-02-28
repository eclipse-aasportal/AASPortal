/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { DashboardCommand } from './dashboard-command';
import { DashboardChart, DashboardChartType, DashboardItem, DashboardPage } from '../dashboard.store';
import { DashboardStore } from '../dashboard.store';

export class SetChartTypeCommand extends DashboardCommand {
    public constructor(
        store: DashboardStore,
        private page: DashboardPage,
        private item: DashboardItem,
        private chartType: DashboardChartType,
    ) {
        super('Set chart type', store);
    }

    protected executing(): void {
        const page = cloneDeep(this.page);
        const item = page.items[this.page.items.indexOf(this.item)] as DashboardChart;

        if (this.isChart(item)) {
            item.chartType = this.chartType;
            this.store.update(page);
        } else {
            throw new Error('Not implemented.');
        }
    }
}
