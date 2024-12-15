/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Routes } from '@angular/router';
import { AASComponent } from './aas/aas.component';
import { AboutComponent } from './about/about.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { StartComponent } from './start/start.component';
import { ViewComponent } from './view/view.component';
import { viewRoutes } from 'aas-lib';

export const routes: Routes = [
    { path: 'start', component: StartComponent },
    { path: 'aas', component: AASComponent },
    {
        path: 'view',
        component: ViewComponent,
        children: viewRoutes,
    },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'about', component: AboutComponent },
    { path: '', pathMatch: 'full', redirectTo: 'start' },
];
