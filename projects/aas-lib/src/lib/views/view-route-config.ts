/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ViewRoute } from '../types';
import { CarbonFootprintView } from './carbon-footprint/carbon-footprint-view';
import { ContactInformationView } from './contact-information/contact-information-view';
import { CustomerFeedbackView } from './customer-feedback/customer-feedback-view';
import { DigitalProductPassportView } from './digital-product-passport/digital-product-passport-view';
import { DocumentBrowserView } from './document-browser/document-browser-view';
import { HandoverDocumentationView } from './handover-documentation/handover-documentation-view';
import { NameplateView } from './nameplate/nameplate-view';
import { OperationalDataView } from './operational-data/operational-data-view';
import { TechnicalDataView } from './technical-data/technical-data-view';
import { HierarchicalStructureView } from './hierarchical-structure/hierarchical-structure-view';
import { ServiceRequestNotification } from './service-request-notification/service-request-notification';
import {
    CARBON_FOOTPRINT_0_9,
    CARBON_FOOTPRINT_1_0,
    CONTACT_INFORMATION_1_0,
    CUSTOMER_FEEDBACK,
    HANDOVER_DOCUMENTATION_1_2,
    HANDOVER_DOCUMENTATION_2_0,
    HIERARCHICAL_STRUCTURES_1_0,
    HIERARCHICAL_STRUCTURES_1_1,
    NAMEPLATE_2_0,
    NAMEPLATE_3_0,
    NAMEPLATE_FHG,
    NAMEPLATE_HSU,
    TECHNICAL_DATA_1_2,
} from './views-constants';
import { AssetStatus } from './asset-status/asset-status';
import { DocumentContent } from './document-content/document-content';

/** The routes to the specific views. */
export const viewRoutes: ViewRoute[] = [
    {
        path: 'AssetStatus',
        component: AssetStatus,
        data: {
            type: 'Leaf',
            idShorts: ['AssetStatus'],
        },
    },
    {
        path: 'Browser',
        component: DocumentBrowserView,
        data: {
            type: 'Default',
        },
    },
    {
        path: 'CarbonFootprint',
        component: CarbonFootprintView,
        data: {
            type: 'Leaf',
            semanticIds: [CARBON_FOOTPRINT_1_0, CARBON_FOOTPRINT_0_9],
        },
    },
    {
        path: 'ContactInformation',
        component: ContactInformationView,
        data: {
            type: 'Leaf',
            semanticIds: [CONTACT_INFORMATION_1_0],
        },
    },
    {
        path: 'content',
        component: DocumentContent,
        data: {
            type: 'Default',
        },
    },
    {
        path: 'CustomerFeedback',
        component: CustomerFeedbackView,
        data: {
            type: 'Leaf',
            semanticIds: [CUSTOMER_FEEDBACK],
        },
    },
    {
        path: 'DigitalProductPassport',
        component: DigitalProductPassportView,
        data: {
            type: 'Composition',
            routes: ['Nameplate', 'CarbonFootprint', 'HandoverDocumentation'],
        },
    },
    {
        path: 'HandoverDocumentation',
        component: HandoverDocumentationView,
        data: {
            type: 'Leaf',
            semanticIds: [HANDOVER_DOCUMENTATION_2_0, HANDOVER_DOCUMENTATION_1_2],
        },
    },
    {
        path: 'HierarchicalStructure',
        component: HierarchicalStructureView,
        data: {
            type: 'Leaf',
            semanticIds: [HIERARCHICAL_STRUCTURES_1_0, HIERARCHICAL_STRUCTURES_1_1],
        },
    },
    {
        path: 'Nameplate',
        component: NameplateView,
        data: {
            type: 'Leaf',
            semanticIds: [NAMEPLATE_2_0, NAMEPLATE_FHG, NAMEPLATE_HSU, NAMEPLATE_3_0],
        },
    },
    {
        path: 'OperationalData',
        component: OperationalDataView,
        data: {
            type: 'Leaf',
            idShorts: ['OperationalData'],
        },
    },
    {
        path: 'Laser',
        component: OperationalDataView,
        data: {
            type: 'Leaf',
            idShorts: ['OperationalData'],
        },
    },
    {
        path: 'ServiceRequestNotification',
        component: ServiceRequestNotification,
        data: {
            type: 'Leaf',
            idShorts: ['ServiceRequestNotification'],
        },
    },
    {
        path: 'TechnicalData',
        component: TechnicalDataView,
        data: {
            type: 'Leaf',
            semanticIds: [TECHNICAL_DATA_1_2],
        },
    },
];
