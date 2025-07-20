/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Route } from '@angular/router';
import { CustomerFeedbackComponent } from './customer-feedback/customer-feedback.component';
import { NameplateView } from './nameplate/nameplate.view';
import { DigitalProductPassportView } from './digital-product-passport/digital-product-passport.view';
import { HandoverDocumentationView } from './handover-documentation/handover-documentation.view';
import { DocumentBrowserComponent } from './document-browser/document-browser.component';
import { OperationalDataView } from './operational-data/operational-data-view';
import { ContactInformationsView } from './contact-informations/contact-informations.view';
import { CarbonFootprintView } from './carbon-footprint/carbon-footprint.view';
import { TechnicalDataView } from './technical-data/technical-data.view';

export const CustomerFeedback = 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback';
export const ZVEINameplate = 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate';
export const FHGNameplate = 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate';
export const HSUNameplate = 'https://www.hsu-hh.de/aut/aas/nameplate';
export const Nameplate_3_0 = 'https://admin-shell.io/idta/nameplate/3/0/Nameplate';
export const HandoverDocumentation_001 = '0173-1#01-AHF578#001';
export const HandoverDocumentation_003 = '0173-1#01-AHF578#003';
export const CarbonFootprint_0_9 = 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9';
export const CarbonFootprint_1_0 = 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/1/0';
export const ContactInformations_1_0 = 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations';
export const TechnicalData_1_2 = 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2';
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
        component: NameplateView,
        data: {
            semanticIds: [ZVEINameplate, FHGNameplate, HSUNameplate, Nameplate_3_0],
        },
    },
    {
        path: 'DigitalProductPassport',
        component: DigitalProductPassportView,
    },
    {
        path: 'HandoverDocumentation',
        component: HandoverDocumentationView,
        data: {
            semanticIds: [HandoverDocumentation_003, HandoverDocumentation_001],
        },
    },
    {
        path: 'ContactInformations',
        component: ContactInformationsView,
        data: {
            semanticIds: [ContactInformations_1_0],
        },
    },
    {
        path: 'CarbonFootprint',
        component: CarbonFootprintView,
        data: {
            semanticIds: [CarbonFootprint_1_0, CarbonFootprint_0_9],
        },
    },
    {
        path: 'OperationalData',
        component: OperationalDataView,
    },
    {
        path: 'TechnicalData',
        component: TechnicalDataView,
        data: {
            semanticIds: [TechnicalData_1_2],
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
