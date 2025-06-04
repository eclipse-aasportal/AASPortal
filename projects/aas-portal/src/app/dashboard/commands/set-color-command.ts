/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DashboardCommand } from './dashboard-command';
import { DashboardService } from '../dashboard.service';
import { DashboardChartItem, DashboardPage, DashboardSource } from '../dashboard-types';

export class SetColorCommand extends DashboardCommand {
    public constructor(
        service: DashboardService,
        private page: DashboardPage,
        private item: DashboardChartItem,
        private color: string,
    ) {
        super('Set color', service);
    }

    protected executing(): void {
        const i = this.page.items.indexOf(this.item);
        if (i < 0) {
            throw new Error('INVALID_OPERATION');
        }

        const index = this.item.sources.findIndex(item => item.label === this.item.source());
        const source = this.item.sources[index];
        const page = { ...this.page, items: [...this.page.items] };
        page.items[i] = { ...this.item, sources: [...this.item.sources] };
        page.items[i].sources[index] = { ...source, color: this.color };
        this.service.updatePage(page);
    }
}
