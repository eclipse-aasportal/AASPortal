/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Store } from '@ngrx/store';
import { first } from 'rxjs';
import { Command } from '../../types/command';
import * as DashboardSelectors from '../dashboard.selectors';
import * as DashboardActions from '../dashboard.actions';
import { DashboardChart, DashboardItem, DashboardItemType, DashboardRow, DashboardState, State } from '../dashboard.state';

export abstract class DashboardCommand extends Command {
    private preState!: DashboardState;
    private postState!: DashboardState;

    constructor(name: string, store: Store) {
        super(name);

        this.store = store as Store<State>;
    }

    protected store: Store<State>

    protected onExecute(): void {
        this.store.select(DashboardSelectors.selectState).pipe(first()).subscribe(state => this.preState = state);
        this.executing();
        this.store.select(DashboardSelectors.selectState).pipe(first()).subscribe(state => this.postState = state);
    }

    protected abstract executing(): void;

    protected onUndo(): void {
        this.store.dispatch(DashboardActions.setState({ state: this.preState }));
    }

    protected onRedo(): void {
        this.store.dispatch(DashboardActions.setState({ state: this.postState }));
    }

    protected onAbort(): void {
        this.store.dispatch(DashboardActions.setState({ state: this.preState }));
    }

    protected isChart(item: DashboardItem): item is DashboardChart {
        return item.type === DashboardItemType.Chart;
    }

    protected getRows(grid: DashboardItem[][]): DashboardRow[] {
        return grid.map(row => ({
            columns: row.map(item => ({
                id: item.id,
                item: item,
                itemType: item.type
            }))
        }));
    }

    protected validateItems(grid: DashboardItem[][]): DashboardItem[][] {
        grid.forEach((row, y) => {
            row.forEach((item, x) => item.positions[0].x = x);
            row.forEach(item => item.positions[0].y = y);
        });

        return grid;
    }
}