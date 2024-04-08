/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AASComponent } from './aas/aas.component';
import { CanActivateAAS } from './aas/can-activate-aas.guard';
import { AboutComponent } from './about/about.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { StartComponent } from './start/start.component';
import { ViewComponent } from './view/view.component';

const routes: Routes = [
    { path: 'start', component: StartComponent },
    { path: 'aas', component: AASComponent, canActivate: [CanActivateAAS] },
    { path: 'view', component: ViewComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'about', component: AboutComponent },
    { path: '', pathMatch: 'full', redirectTo: 'start' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
    exports: [RouterModule],
    providers: [CanActivateAAS],
})
export class AppRoutingModule {}
