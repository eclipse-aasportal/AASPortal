/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError } from 'aas-core';
import { DashboardPage, DashboardStore } from '../dashboard.store';
import { DashboardCommand } from './dashboard-command';
import { ERRORS } from '../../types/errors';

export class RenamePageCommand extends DashboardCommand {
    public constructor(
        store: DashboardStore,
        private page: DashboardPage,
        private newName: string,
    ) {
        super('Delete page', store);
    }

    protected executing(): void {
        const name = this.newName?.trim();
        if (!name) {
            throw new Error('Valid page name expected.');
        }

        if (this.store.pages.some(item => item.name === name)) {
            throw new ApplicationError(
                `A page withe name "${name}" already exists.`,
                ERRORS.DASHBOARD_PAGE_ALREADY_EXISTS,
                name,
            );
        }

        this.renamePage(name);
    }

    private renamePage(name: string): void {
        const index = this.store.pages.indexOf(this.page);
        if (index < 0) {
            return;
        }

        const pages = [...this.store.pages];
        pages[index] = { ...this.page, name };
        this.store.updateState(state => ({ ...state, pages }));
    }
}
