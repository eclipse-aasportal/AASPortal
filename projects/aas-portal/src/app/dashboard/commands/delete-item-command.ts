/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { DashboardService, DashboardPage, DashboardItem } from '../dashboard.service';
import { DashboardCommand } from './dashboard-command';

export class DeleteItemCommand extends DashboardCommand {
    public constructor(
        dashboard: DashboardService,
        private page: DashboardPage,
        private items: DashboardItem[],
    ) {
        super('Delete item', dashboard);
    }

    protected executing(): void {
        const page = cloneDeep(this.page);
        page.items = page.items.filter(item => this.items.find(i => i.id === item.id) == null);
        const grid = this.dashboard.getGrid(page);
        this.validateItems(grid);
        this.dashboard.update(page);
    }
}
