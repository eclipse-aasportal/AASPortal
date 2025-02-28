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

export class AddNewPageCommand extends DashboardCommand {
    public constructor(
        store: DashboardStore,
        private pageName?: string,
    ) {
        super('Add new page', store);
    }

    protected executing(): void {
        const name = this.pageName?.trim();
        if (!name && this.store.pages.some(item => item.name === name)) {
            throw new ApplicationError(
                `A page withe name "${name}" already exists.`,
                ERRORS.DASHBOARD_PAGE_ALREADY_EXISTS,
                name,
            );
        }

        this.addNewPage(name);
    }

    private addNewPage(name?: string): void {
        name = name?.trim() ?? this.store.createPageName();
        const page: DashboardPage = {
            name: name,
            items: [],
            requests: [],
        };

        this.store.updateState(state => ({ ...state, pages: [...state.pages, page] }));
    }
}
