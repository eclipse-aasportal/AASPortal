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
import { DashboardItem, DashboardPage } from '../dashboard-types';

export class DeleteItemCommand extends DashboardCommand {
    public constructor(
        service: DashboardService,
        private page: DashboardPage,
        private items: DashboardItem[],
    ) {
        super('Delete item', service);
    }

    protected executing(): void {
        const page = cloneDeep(this.page);
        page.items = page.items.filter(item => this.items.find(i => i.id === item.id) == null);
        const grid = this.service.getGrid(page);
        this.validateItems(grid);
        this.service.updatePage(page);
    }
}
