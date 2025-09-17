/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DashboardCommand } from './dashboard-command';
import { DashboardService } from '../dashboard.service';
import { DashboardChartItem, DashboardPage } from '../dashboard-types';

export class SetMinMaxCommand extends DashboardCommand {
    public constructor(
        service: DashboardService,
        private page: DashboardPage,
        private item: DashboardChartItem,
        private min?: number,
        private max?: number,
    ) {
        super('Set min/max', service);
    }

    protected executing(): void {
        const i = this.page.items.indexOf(this.item);
        if (i < 0) {
            throw new Error('INVALID_OPERATION');
        }

        const page = { ...this.page, items: [...this.page.items] };
        page.items[i] = { ...this.item };

        if (typeof this.min === 'number') {
            page.items[i].min = Number.isNaN(this.min) ? undefined : this.min;
        }

        if (typeof this.max === 'number') {
            page.items[i].max = Number.isNaN(this.max) ? undefined : this.max;
        }

        this.service.updatePage(page);
    }
}
