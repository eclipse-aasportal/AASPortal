/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import * as int from '../internal';
import { ViewRoute } from '../types';

export const viewRoutes: ViewRoute[] = [
    {
        path: 'Browser',
        component: int.DocumentBrowserView,
        data: {
            type: 'Default',
        },
    },
    {
        path: 'CarbonFootprint',
        component: int.CarbonFootprintView,
        data: {
            type: 'Leaf',
            semanticIds: [int.CARBON_FOOTPRINT_1_0, int.CARBON_FOOTPRINT_0_9],
        },
    },
    {
        path: 'ContactInformations',
        component: int.ContactInformationsView,
        data: {
            type: 'Leaf',
            semanticIds: [int.CONTACT_INFORMATIONS_1_0],
        },
    },
    {
        path: 'CustomerFeedback',
        component: int.CustomerFeedbackView,
        data: {
            type: 'Leaf',
            semanticIds: [int.CUSTOMER_FEEDBACK],
        },
    },
    {
        path: 'DigitalProductPassport',
        component: int.DigitalProductPassportView,
        data: {
            type: 'Composition',
            routes: ['Nameplate', 'CarbonFootprint', 'HandoverDocumentation'],
        },
    },
    {
        path: 'HandoverDocumentation',
        component: int.HandoverDocumentationView,
        data: {
            type: 'Leaf',
            semanticIds: [int.HANDOVER_DOCUMENTATION_2_0, int.HANDOVER_DOCUMENTATION_1_2],
        },
    },
    {
        path: 'Nameplate',
        component: int.NameplateView,
        data: {
            type: 'Leaf',
            semanticIds: [int.NAMEPLATE_2_0, int.NAMEPLATE_FHG, int.NAMEPLATE_HSU, int.NAMEPLATE_3_0],
        },
    },
    {
        path: 'OperationalData',
        component: int.OperationalDataView,
        data: {
            type: 'Leaf',
            idShorts: ['OperationalData'],
        },
    },
    {
        path: 'TechnicalData',
        component: int.TechnicalDataView,
        data: {
            type: 'Leaf',
            semanticIds: [int.TECHNICAL_DATA_1_2],
        },
    },
];
