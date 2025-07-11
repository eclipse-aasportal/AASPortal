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
import { DocumentBrowserComponent } from './document-browser/document-browser.component';
import { LaserComponent } from './laser/laser.component';

export const CustomerFeedback = 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback';
export const ZVEINameplate = 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate';
export const FHGNameplate = 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate';
export const HSUNameplate = 'https://www.hsu-hh.de/aut/aas/nameplate';
export const IDTANameplate = 'https://admin-shell.io/idta/nameplate/3/0/Nameplate';
export const HandoverDocumentation = '0173-1#01-AHF578#003';
export const CarbonFootprint_0_9 = 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9';

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
            semanticIds: [ZVEINameplate, FHGNameplate, HSUNameplate, IDTANameplate],
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
    {
        path: 'Laser',
        component: LaserComponent,
        data: {
            ids: ['https://smartfactory-owl.de/aas/laser', 'http://customer.com/aas/9175_7013_7091_9168'],
        },
    },
    {
        path: 'Browser',
        component: DocumentBrowserComponent,
        data: {
            default: true,
        },
    },
];

/**
 * Returns the route that corresponds to an Identifiable with the specified identifier and semantic identifier.
 * @param id The current identifier.
 * @param semanticId The current semantic identifier.
 * @returns The route or `undefined`.
 */
export function findRoute(id: string, semanticId?: string): Route | undefined {
    for (const route of viewRoutes) {
        if (semanticId) {
            const semanticIds = route?.data?.semanticIds;
            if (Array.isArray(semanticIds) && semanticIds.indexOf(semanticId) >= 0) {
                return route;
            }
        }

        const ids = route?.data?.ids;
        if (Array.isArray(ids) && ids.indexOf(id) >= 0) {
            return route;
        }
    }

    return viewRoutes.find(route => !!route.data?.default);
}
