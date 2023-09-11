/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Store } from "@ngrx/store";
import { cloneDeep } from "lodash-es";
import { DashboardChart, DashboardPage } from "../dashboard.state";
import { DashboardService } from "../dashboard.service";
import { DashboardCommand } from "./dashboard-command";

export class SetMinMaxCommand extends DashboardCommand {
    constructor(
        store: Store,
        private dashboard: DashboardService,
        private page: DashboardPage,
        private chart: DashboardChart,
        private min?: number,
        private max?: number) {
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

        this.dashboard.update(page);
    }
}