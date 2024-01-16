/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Store } from '@ngrx/store';
import { cloneDeep } from 'lodash-es';
import { DashboardItem, DashboardPage, DashboardRow } from '../dashboard.state';
import { DashboardService } from '../dashboard.service';
import { DashboardCommand } from './dashboard-command';

export class MoveRightCommand extends DashboardCommand {
    public constructor(
        store: Store,
        private dashboard: DashboardService,
        private page: DashboardPage,
        private item: DashboardItem,
    ) {
        super('Move right', store);
    }

    protected executing(): void {
        if (!this.dashboard.canMoveRight(this.page, this.item)) {
            throw new Error(`Item can not be moved to the right.`);
        }

        let rows: DashboardRow[] | undefined;
        const page = cloneDeep(this.page);
        const item = page.items[this.page.items.indexOf(this.item)];
        const grid = this.dashboard.getGrid(page);
        const row = grid[item.positions[0].y];
        const index = row.indexOf(item);
        if (index < row.length - 1) {
            row.splice(index, 1);
            row.splice(index + 1, 0, item);
            rows = this.getRows(this.validateItems(grid));
        }

        this.dashboard.update(page, rows);
    }
}
