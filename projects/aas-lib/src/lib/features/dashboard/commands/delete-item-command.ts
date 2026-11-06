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

export class DeleteItemCommand extends DashboardCommand {
    public constructor(
        service: DashboardService,
        private page: DashboardPage,
        private items: DashboardChartItem[],
    ) {
        super('Delete item', service);
    }

    protected executing(): void {
        const page = { ...this.page };
        page.items = page.items.filter(item => this.items.find(i => i.id === item.id) == null);
        this.service.updatePage(page);
    }
}
