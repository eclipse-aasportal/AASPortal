/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument, getSemanticId, isEnvironment, isSubmodel } from 'aas-core';

import { ViewRoute, ViewRouteMap, ViewRouteResult } from '../types';
import { CarbonFootprintView } from './carbon-footprint/carbon-footprint-view';
import { ContactInformationView } from './contact-information/contact-information-view';
import { CustomerFeedbackView } from './customer-feedback/customer-feedback-view';
import { DigitalProductPassportView } from './digital-product-passport/digital-product-passport-view';
import { DocumentBrowserView } from './document-browser/document-browser-view';
import { HandoverDocumentationView } from './handover-documentation/handover-documentation-view';
import { NameplateView } from './nameplate/nameplate-view';
import { OperationalDataView } from './operational-data/operational-data-view';
import { TechnicalDataView } from './technical-data/technical-data-view';
import {
    CARBON_FOOTPRINT_0_9,
    CARBON_FOOTPRINT_1_0,
    CONTACT_INFORMATION_1_0,
    CUSTOMER_FEEDBACK,
    HANDOVER_DOCUMENTATION_1_2,
    HANDOVER_DOCUMENTATION_2_0,
    NAMEPLATE_2_0,
    NAMEPLATE_3_0,
    NAMEPLATE_FHG,
    NAMEPLATE_HSU,
    TECHNICAL_DATA_1_2,
} from './views-constants';

/** The routes to the specific views. */
export const viewRoutes: ViewRoute[] = [
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
<<<<<<< HEAD
=======
        path: 'Laser',
        component: OperationalDataView,
        data: {
            type: 'Leaf',
            idShorts: ['OperationalData'],
        },
    },
    {
>>>>>>> development
        path: 'TechnicalData',
        component: TechnicalDataView,
        data: {
            type: 'Leaf',
            semanticIds: [TECHNICAL_DATA_1_2],
        },
    },
];

/**
 * Returns the route that corresponds to the specified Submodel.
 * @param submodel The current Submodel.
 * @param defaultRoute Indicates to return the default route.
 * @returns The route or `undefined`.
 */
export function findRouteForSubmodel(submodel: aas.Submodel, defaultRoute = true): ViewRoute | undefined {
    const semanticId = getSemanticId(submodel);
    for (const route of viewRoutes) {
        if (route.data.type !== 'Leaf') {
            continue;
        }

        if (semanticId && route.data.semanticIds) {
            if (route.data.semanticIds.indexOf(semanticId) >= 0) {
                return route;
            }
        }

        if (route.data.idShorts) {
            for (const idShort of route.data.idShorts) {
                if (submodel.idShort === idShort) {
                    return route;
                }
            }
        }
    }

    return defaultRoute ? viewRoutes.find(item => item.data.type === 'Default') : undefined;
}

/**
 * Returns the route that corresponds to the specified AAS document or AAS environment.
 * @param arg The current AAS document or AAS environment.
 * @param defaultRoute Indicates to return the default route.
 * @returns The route or `undefined`.
 */
export function findRouteForShell(arg: AASDocument | aas.Environment, defaultRoute = true): ViewRouteResult {
    const env = isEnvironment(arg) ? arg : arg.content;
    if (!env) {
        return {};
    }

    const { route, map } = findCompositionRoute(env);
    if (route) {
        return { route, map };
    }

    return defaultRoute ? { route: viewRoutes.find(item => item.data.type === 'Default') } : {};

    function findCompositionRoute(env: aas.Environment): ViewRouteResult {
        const leafRoutes = new Map<string, ViewRoute>(
            viewRoutes.filter(route => route.data.type === 'Leaf').map(route => [route.path!, route]),
        );

        const submodelSemanticIds = new Map<string, aas.Submodel>();
        for (const submodel of env.submodels) {
            const semanticId = getSemanticId(submodel);
            if (semanticId) {
                submodelSemanticIds.set(semanticId, submodel);
            }
        }

        const map: ViewRouteMap = {};
        for (const route of viewRoutes) {
            if (route.data.type !== 'Composition') {
                continue;
            }

            for (const path of route.data.routes) {
                const leafRoute = leafRoutes.get(path);
                if (!leafRoute) {
                    return {};
                }

                if (leafRoute.data.type !== 'Leaf') {
                    continue;
                }

                const data = leafRoute.data;
                if (data.semanticIds && data.semanticIds.length) {
                    const semanticId = data.semanticIds.find(id => submodelSemanticIds.has(id));
                    if (!semanticId) {
                        return {};
                    }

                    map[leafRoute.path!] = submodelSemanticIds.get(semanticId)!;
                }

                if (data.idShorts) {
                    let submodel: aas.Submodel | undefined;
                    for (const idShort of data.idShorts) {
                        const submodel = env.submodels.find(submodel => submodel.idShort === idShort);

                        if (submodel) {
                            break;
                        }
                    }

                    if (!submodel) {
                        return {};
                    }

                    map[leafRoute.path!] = submodel;
                }
            }

            return { route, map };
        }

        return {};
    }
}

/**
 * Determine whether the specified Submodel, AAS document or AAS environment has a specific view.
 * @param arg The current Submodel, AAS document or AAS environment.
 * @returns `true` if a specific view exists; otherwise; `false`.
 */
export function hasSpecificView(arg: aas.Submodel | AASDocument | aas.Environment): boolean {
    if (isSubmodel(arg)) {
        return findRouteForSubmodel(arg, false) !== undefined;
    }

    const { route } = findRouteForShell(arg, false);
    return route !== undefined;
}
