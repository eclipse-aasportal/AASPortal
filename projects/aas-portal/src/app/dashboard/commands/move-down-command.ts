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

export class MoveDownCommand extends DashboardCommand {
    public constructor(
        service: DashboardService,
        private page: DashboardPage,
        private item: DashboardItem,
    ) {
        super('Move down', service);
    }

    protected executing(): void {
        if (!this.service.canMoveDown(this.page, this.item)) {
            throw new Error(`Item can not be moved down.`);
        }

        const page = cloneDeep(this.page);
        const item = page.items[this.page.items.indexOf(this.item)];
        const y = item.position.y;
        const grid = this.service.getGrid(page);
        const sourceRow = grid[y];
        if (y < grid.length - 1) {
            const targetRow = grid[y + 1];
            if (targetRow.length < 12) {
                sourceRow.splice(item.position.x, 1);
                targetRow.push(item);
                if (sourceRow.length === 0) {
                    grid.splice(y, 1);
                }

                this.validateItems(grid);
            }
        } else if (sourceRow.length > 1) {
            sourceRow.splice(item.position.x, 1);
            const targetRow: DashboardItem[] = [item];
            grid.push(targetRow);
            this.validateItems(grid);
        }

        this.service.updatePage(page);
    }
}
