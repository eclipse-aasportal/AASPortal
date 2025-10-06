/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Routes } from '@angular/router';
import { ShellsComponent } from './shells/shells.component';
import { ConceptDescriptionsComponent } from './concept-descriptions/concept-descriptions.component';
import { AASComponent } from './aas/aas.component';
import { canActivateAASGuard } from './aas/can-activate-aas.guard';

export const routes: Routes = [
    { path: 'shells', component: ShellsComponent },
    { path: 'shells/:aasId', component: AASComponent, canActivate: [canActivateAASGuard] },
    { path: 'concept-descriptions', component: ConceptDescriptionsComponent },
    { path: 'concept-descriptions/:cdId', component: ConceptDescriptionsComponent },
    { path: '', redirectTo: '/shells', pathMatch: 'full' },
    { path: '**', component: ShellsComponent },
];
