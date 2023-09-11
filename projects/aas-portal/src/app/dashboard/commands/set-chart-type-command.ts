/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

 import { Store } from "@ngrx/store";
 import { cloneDeep } from "lodash-es";
 import { DashboardChart, DashboardChartType, DashboardItem, DashboardPage } from "../dashboard.state";
 import { DashboardService } from "../dashboard.service";
 import { DashboardCommand } from "./dashboard-command";
 
 export class SetChartTypeCommand extends DashboardCommand {
     constructor(
         store: Store,
         private dashboard: DashboardService,
         private page: DashboardPage,
         private item: DashboardItem,
         private chartType: DashboardChartType) {
         super('Set chart type', store);
     }
 
     protected executing(): void {
         const page = cloneDeep(this.page);
         const item = page.items[this.page.items.indexOf(this.item)] as DashboardChart;
 
         if (this.isChart(item)) {
             item.chartType = this.chartType;
             this.dashboard.update(page);
         } else {
             throw new Error('Not implemented.');
         }
     }
 }