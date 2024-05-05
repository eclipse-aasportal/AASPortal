/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { cloneDeep } from 'lodash-es';
import { DashboardItem, DashboardPage, DashboardService } from '../dashboard.service';
import { DashboardCommand } from './dashboard-command';

export class MoveRightCommand extends DashboardCommand {
    public constructor(
        dashboard: DashboardService,
        private page: DashboardPage,
        private item: DashboardItem,
    ) {
        super('Move right', dashboard);
    }

    protected executing(): void {
        if (!this.dashboard.canMoveRight(this.page, this.item)) {
            throw new Error(`Item can not be moved to the right.`);
        }

        const page = cloneDeep(this.page);
        const item = page.items[this.page.items.indexOf(this.item)];
        const grid = this.dashboard.getGrid(page);
        const row = grid[item.positions[0].y];
        const index = row.indexOf(item);
        if (index < row.length - 1) {
            row.splice(index, 1);
            row.splice(index + 1, 0, item);
            this.validateItems(grid);
        }

        this.dashboard.update(page);
    }
}
