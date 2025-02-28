/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DashboardPage, DashboardStore } from '../dashboard.store';
import { DashboardCommand } from './dashboard-command';

export class DeletePageCommand extends DashboardCommand {
    public constructor(
        store: DashboardStore,
        private page: DashboardPage,
    ) {
        super('Delete page', store);
    }

    protected executing(): void {
        const index = this.store.pages.findIndex(page => page.name === this.page.name);
        const pages = this.store.pages.filter(page => page.name !== this.page.name);
        if (pages.length === 0) {
            pages.push({ name: this.store.createPageName(), items: [], requests: [] });
        }

        let selectedIndex = this.store.index;
        if (index === selectedIndex) {
            selectedIndex = Math.min(pages.length - 1, index);
        } else if (index < selectedIndex) {
            --selectedIndex;
        }

        this.store.setState({ pages, index: selectedIndex });
    }
}
