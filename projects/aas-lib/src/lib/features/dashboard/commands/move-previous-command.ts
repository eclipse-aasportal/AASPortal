/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DashboardCommand } from './dashboard-command';
import { DashboardService } from '../dashboard.service';
import { DashboardChartItem, DashboardPage } from '../dashboard-types';

export class MovePreviousCommand extends DashboardCommand {
    public constructor(
        service: DashboardService,
        private page: DashboardPage,
        private item: DashboardChartItem,
    ) {
        super('Move left', service);
    }

    protected executing(): void {
        const index = this.page.items.indexOf(this.item);
        if (index < 1) {
            throw new Error('INVALID_OPERATION');
        }

        const page = { ...this.page, items: [...this.page.items] };
        page.items[index] = page.items[index - 1];
        page.items[index - 1] = this.item;
        this.service.updatePage(page);
    }
}
