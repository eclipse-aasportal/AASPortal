/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { DashboardItem, DashboardPage, DashboardStore } from '../dashboard.store';
import { DashboardCommand } from './dashboard-command';

export class MoveUpCommand extends DashboardCommand {
    public constructor(
        store: DashboardStore,
        private page: DashboardPage,
        private item: DashboardItem,
    ) {
        super('Move up', store);
    }

    protected executing(): void {
        if (!this.store.canMoveUp(this.page, this.item)) {
            throw new Error(`Item can not be moved up.`);
        }

        const page = cloneDeep(this.page);
        const item = page.items[this.page.items.indexOf(this.item)];
        const y = item.positions[0].y;
        const grid = this.store.getGrid(page);
        const sourceRow = grid[y];
        if (y > 0) {
            const targetRow = grid[y - 1];
            if (targetRow.length < 12) {
                sourceRow.splice(item.positions[0].x, 1);
                targetRow.push(item);
                if (sourceRow.length === 0) {
                    grid.splice(y, 1);
                }

                this.validateItems(grid);
            }
        } else if (sourceRow.length > 1) {
            sourceRow.splice(item.positions[0].x, 1);
            const targetRow: DashboardItem[] = [item];
            grid.splice(0, 0, targetRow);
            this.validateItems(grid);
        }

        this.store.update(page);
    }
}
