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

export class SetColorCommand extends DashboardCommand {
    public constructor(
        service: DashboardService,
        private page: DashboardPage,
        private item: DashboardItem,
        private index: number,
        private color: string,
    ) {
        super('Set color', service);
    }

    protected executing(): void {
        const page = cloneDeep(this.page);
        const item = page.items[this.page.items.indexOf(this.item)];

        if (this.isChart(item)) {
            item.sources[this.index].color = this.color;
            this.service.updatePage(page);
        } else {
            throw new Error('Not implemented.');
        }
    }
}
