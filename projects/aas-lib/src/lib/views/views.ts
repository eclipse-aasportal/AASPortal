/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Route } from '@angular/router';
import { CustomerFeedbackComponent } from './customer-feedback/customer-feedback.component';
import { DigitalNameplateComponent } from './digital-nameplate/digital-nameplate.component';
import { DigitalProductPassportComponent } from './digital-product-passport/digital-product-passport.component';
import { HandoverDocumentationComponent } from './handover-documentation/handover-documentation.component';
import { BrowserComponent } from './browser/browser.component';

export const CustomerFeedback = 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback';
export const ZVEINameplate = 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate';
export const FHGNameplate = 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate';
export const HSUNameplate = 'https://www.hsu-hh.de/aut/aas/nameplate';
export const HandoverDocumentation = '0173-1#01-AHF578#003';
export const CarbonFootprint = 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9';

export const viewRoutes: Route[] = [
    {
        path: 'CustomerFeedback',
        component: CustomerFeedbackComponent,
        data: {
            semanticIds: [CustomerFeedback],
        },
    },
    {
        path: 'Nameplate',
        component: DigitalNameplateComponent,
        data: {
            semanticIds: [ZVEINameplate, FHGNameplate, HSUNameplate],
        },
    },
    {
        path: 'DigitalProductPassport',
        component: DigitalProductPassportComponent,
    },
    {
        path: 'HandoverDocumentation',
        component: HandoverDocumentationComponent,
        data: {
            semanticIds: [HandoverDocumentation],
        },
    },
    { path: '**', component: BrowserComponent },
];

/**
 * Returns the route that corresponds to the specified semantic identifier.
 * @param semanticId The current semantic identifier.
 * @returns The route or `undefined`.
 */
export function findRoute(semanticId: string): Route | undefined {
    for (const route of viewRoutes) {
        const semanticIds = route?.data?.semanticIds;
        if (Array.isArray(semanticIds) && semanticIds.indexOf(semanticId) >= 0) {
            return route;
        }
    }
    return undefined;
}
