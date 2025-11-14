/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError } from 'aas-core';
import { DashboardCommand } from './dashboard-command';
import { ERRORS } from '../../types/errors';
import { DashboardService } from '../dashboard.service';
import { DashboardPage } from '../dashboard-types';

export class RenamePageCommand extends DashboardCommand {
    public constructor(
        service: DashboardService,
        private page: DashboardPage,
        private newName: string,
    ) {
        super('Delete page', service);
    }

    protected executing(): void {
        const name = this.newName?.trim();
        if (!name) {
            throw new Error('Valid page name expected.');
        }

        if (this.service.pages().some(item => item.name === name)) {
<<<<<<< HEAD
            throw new ApplicationError(
                `A page withe name "${name}" already exists.`,
                ERRORS.DASHBOARD_PAGE_ALREADY_EXISTS,
                name,
            );
=======
            throw new ApplicationError(ERRORS.DASHBOARD_PAGE_ALREADY_EXISTS, { name }, 409);
>>>>>>> development
        }

        this.renamePage(name);
    }

    private renamePage(name: string): void {
        const index = this.service.pages().indexOf(this.page);
        if (index < 0) {
            return;
        }

        this.service.updatePage({ ...this.page, name }, this.page.name);
    }
}
