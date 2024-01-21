/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Store } from '@ngrx/store';
import { DashboardPage } from '../dashboard.state';
import { DashboardService } from '../dashboard.service';
import { DashboardCommand } from './dashboard-command';

export class DeletePageCommand extends DashboardCommand {
    public constructor(
        store: Store,
        private dashboard: DashboardService,
        private page: DashboardPage,
    ) {
        super('Delete page', store);
    }

    protected executing(): void {
        this.dashboard.delete(this.page);
    }
}