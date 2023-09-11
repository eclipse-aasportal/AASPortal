/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Store } from "@ngrx/store";
import { cloneDeep } from "lodash-es";
import { DashboardItem, DashboardPage } from "../dashboard.state";
import { DashboardService } from "../dashboard.service";
import { DashboardCommand } from "./dashboard-command";

export class SetColorCommand extends DashboardCommand {
    constructor(
        store: Store,
        private dashboard: DashboardService,
        private page: DashboardPage,
        private item: DashboardItem,
        private index: number,
        private color: string) {
        super('Set color', store);
    }

    protected executing(): void {
        const page = cloneDeep(this.page);
        const item = page.items[this.page.items.indexOf(this.item)];

        if (this.isChart(item)) {
            item.sources[this.index].color = this.color;
            this.dashboard.update(page);
        } else {
            throw new Error('Not implemented.');
        }
    }
}