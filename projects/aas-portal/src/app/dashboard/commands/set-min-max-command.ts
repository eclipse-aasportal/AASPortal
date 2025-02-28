/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { DashboardCommand } from './dashboard-command';
import { DashboardChart, DashboardPage, DashboardStore } from '../dashboard.store';

export class SetMinMaxCommand extends DashboardCommand {
    public constructor(
        store: DashboardStore,
        private page: DashboardPage,
        private chart: DashboardChart,
        private min?: number,
        private max?: number,
    ) {
        super('Set min/max', store);
    }

    protected executing(): void {
        const page = cloneDeep(this.page);
        const chart = page.items[this.page.items.indexOf(this.chart)] as DashboardChart;
        if (typeof this.min === 'number') {
            chart.min = Number.isNaN(this.min) ? undefined : this.min;
        }

        if (typeof this.max === 'number') {
            chart.max = Number.isNaN(this.max) ? undefined : this.max;
        }

        this.store.update(page);
    }
}
