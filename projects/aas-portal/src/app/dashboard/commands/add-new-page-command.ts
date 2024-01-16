/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Store } from '@ngrx/store';
import { DashboardService } from '../dashboard.service';
import { DashboardCommand } from './dashboard-command';

export class AddNewPageCommand extends DashboardCommand {
    public constructor(
        store: Store,
        private dashboard: DashboardService,
        private pageName?: string,
    ) {
        super('Add new page', store);
    }

    protected executing(): void {
        this.dashboard.addNew(this.pageName);
    }
}
