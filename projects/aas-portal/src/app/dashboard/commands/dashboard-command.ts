/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Command } from '../../types/command';
import { DashboardChart, DashboardItem, DashboardItemType, DashboardRow, DashboardState } from '../dashboard-types';
import { DashboardService } from '../dashboard.service';

export abstract class DashboardCommand extends Command {
    private preState!: DashboardState;
    private postState!: DashboardState;

    protected constructor(
        name: string,
        protected readonly service: DashboardService,
    ) {
        super(name);
    }

    protected onExecute(): void {
        this.preState = this.service.memento;
        this.executing();
        this.postState = this.service.memento;
    }

    protected abstract executing(): void;

    protected onUndo(): void {
        this.service.memento = this.preState;
    }

    protected onRedo(): void {
        this.service.memento = this.postState;
    }

    protected onAbort(): void {
        this.service.memento = this.preState;
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
            row.forEach((item, x) => (item.position.x = x));
            row.forEach(item => (item.position.y = y));
        });
    }
}
