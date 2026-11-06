/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DashboardCommand } from './dashboard-command';
import { DashboardService } from '../dashboard.service';
import { DashboardChartItem, DashboardChartType, DashboardPage } from '../dashboard-types';

export class SetChartTypeCommand extends DashboardCommand {
    public constructor(
        service: DashboardService,
        private page: DashboardPage,
        private item: DashboardChartItem,
        private chartType: DashboardChartType,
    ) {
        super('Set chart type', service);
    }

    protected executing(): void {
        const i = this.page.items.indexOf(this.item);
        if (i < 0) {
            throw new Error('INVALID_OPERATION');
        }

        this.page.items[i].chartType.set(this.chartType);
    }
}
