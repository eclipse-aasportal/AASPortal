/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { DashboardCommand } from './dashboard-command';
import { DashboardItem, DashboardPage, DashboardStore } from '../dashboard.store';

export class MoveLeftCommand extends DashboardCommand {
    public constructor(
        store: DashboardStore,
        private page: DashboardPage,
        private item: DashboardItem,
    ) {
        super('Move left', store);
    }

    protected executing(): void {
        if (!this.store.canMoveLeft(this.page, this.item)) {
            throw new Error(`Item can not be moved to the left.`);
        }

        const page = cloneDeep(this.page);
        const item = page.items[this.page.items.indexOf(this.item)];
        const grid = this.store.getGrid(page);
        const row = grid[item.positions[0].y];
        const index = row.indexOf(item);
        if (index > 0) {
            row.splice(index, 1);
            row.splice(index - 1, 0, item);
            this.validateItems(grid);
        }

        this.store.update(page);
    }
}
