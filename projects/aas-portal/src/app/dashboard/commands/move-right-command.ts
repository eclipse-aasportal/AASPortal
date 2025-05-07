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

export class MoveRightCommand extends DashboardCommand {
    public constructor(
        service: DashboardService,
        private page: DashboardPage,
        private item: DashboardItem,
    ) {
        super('Move right', service);
    }

    protected executing(): void {
        if (!this.service.canMoveRight(this.page, this.item)) {
            throw new Error(`Item can not be moved to the right.`);
        }

        const page = cloneDeep(this.page);
        const item = page.items[this.page.items.indexOf(this.item)];
        const grid = this.service.getGrid(page);
        const row = grid[item.position.y];
        const index = row.indexOf(item);
        if (index < row.length - 1) {
            row.splice(index, 1);
            row.splice(index + 1, 0, item);
            this.validateItems(grid);
        }

        this.service.updatePage(page);
    }
}
