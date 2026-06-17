/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError } from 'aas-core';
import { DashboardCommand } from './dashboard-command';
import { ERRORS } from '../../types/errors';
import { DashboardService } from '../dashboard.service';
import { DashboardPage } from '../dashboard-types';

export class AddNewPageCommand extends DashboardCommand {
    public constructor(
        service: DashboardService,
        private pageName?: string,
    ) {
        super('Add new page', service);
    }

    protected executing(): void {
        const name = this.pageName?.trim();
        if (!name && this.service.pages().some(page => page.name === name)) {
            throw new ApplicationError(ERRORS.DASHBOARD_PAGE_ALREADY_EXISTS, { name }, 409);
        }

        this.addNewPage(name);
    }

    private addNewPage(name?: string): void {
        name = name?.trim() ?? this.service.createPageName();
        const page: DashboardPage = {
            name: name,
            active: false,
            items: [],
            requests: [],
        };

        this.service.addPage(page);
    }
}
