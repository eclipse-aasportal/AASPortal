/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { DashboardItem, DashboardPage, DashboardStore } from '../dashboard.store';
import { DashboardCommand } from './dashboard-command';

export class SetColorCommand extends DashboardCommand {
    public constructor(
        store: DashboardStore,
        private page: DashboardPage,
        private item: DashboardItem,
        private index: number,
        private color: string,
    ) {
        super('Set color', store);
    }

    protected executing(): void {
        const page = cloneDeep(this.page);
        const item = page.items[this.page.items.indexOf(this.item)];

        if (this.isChart(item)) {
            item.sources[this.index].color = this.color;
            this.store.update(page);
        } else {
            throw new Error('Not implemented.');
        }
    }
}
