/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DashboardPage } from '../dashboard-types';
import { DashboardService } from '../dashboard.service';
import { DashboardCommand } from './dashboard-command';

export class DeletePageCommand extends DashboardCommand {
    public constructor(
        service: DashboardService,
        private readonly page: DashboardPage,
    ) {
        super('Delete page', service);
    }

    protected executing(): void {
        this.service.deletePage(this.page);
    }
}
