/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Command } from '../../types/command';
import {
    DashboardService,
    DashboardChart,
    DashboardItem,
    DashboardItemType,
    DashboardRow,
    DashboardState,
} from '../dashboard.service';

export abstract class DashboardCommand extends Command {
    private preState!: DashboardState;
    private postState!: DashboardState;

    protected constructor(
        name: string,
        protected readonly dashboard: DashboardService,
    ) {
        super(name);
    }

    protected onExecute(): void {
        this.preState = this.dashboard.state;
        this.executing();
        this.postState = this.dashboard.state;
    }

    protected abstract executing(): void;

    protected onUndo(): void {
        this.dashboard.state = this.preState;
    }

    protected onRedo(): void {
        this.dashboard.state = this.postState;
    }

    protected onAbort(): void {
        this.dashboard.state = this.preState;
    }

    protected isChart(item: DashboardItem): item is DashboardChart {
        return item.type === DashboardItemType.Chart;
    }

    protected getRows(grid: DashboardItem[][]): DashboardRow[] {
        return grid.map(row => ({
            columns: row.map(item => ({
                id: item.id,
                item: item,
                itemType: item.type,
            })),
        }));
    }

    protected validateItems(grid: DashboardItem[][]): void {
        grid.forEach((row, y) => {
            row.forEach((item, x) => (item.positions[0].x = x));
            row.forEach(item => (item.positions[0].y = y));
        });
    }
}
