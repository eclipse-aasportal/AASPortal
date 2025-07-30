/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Data, Route } from '@angular/router';
import { aas, AASDocument, getReferable, getSemanticId, isEnvironment, isSubmodel } from 'aas-core';

import { CustomerFeedbackComponent } from './customer-feedback/customer-feedback.component';
import { NameplateView } from './nameplate/nameplate.view';
import { DigitalProductPassportView } from './digital-product-passport/digital-product-passport.view';
import { HandoverDocumentationView } from './handover-documentation/handover-documentation.view';
import { DocumentBrowserComponent } from './document-browser/document-browser.component';
import { OperationalDataView } from './operational-data/operational-data-view';
import { ContactInformationsView } from './contact-informations/contact-informations.view';
import { CarbonFootprintView } from './carbon-footprint/carbon-footprint.view';
import { TechnicalDataView } from './technical-data/technical-data.view';

export const CUSTOMER_FEEDBACK = 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback';
export const NAMEPLATE_2_0 = 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate';
export const NAMEPLATE_3_0 = 'https://admin-shell.io/idta/nameplate/3/0/Nameplate';
export const NAMEPLATE_FHG = 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate';
export const NAMEPLATE_HSU = 'https://www.hsu-hh.de/aut/aas/nameplate';
export const HANDOVER_DOCUMENTATION_1_2 = '0173-1#01-AHF578#001';
export const HANDOVER_DOCUMENTATION_2_0 = '0173-1#01-AHF578#003';
export const CARBON_FOOTPRINT_0_9 = 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9';
export const CARBON_FOOTPRINT_1_0 = 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/1/0';
export const CONTACT_INFORMATIONS_1_0 = 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations';
export const TECHNICAL_DATA_1_2 = 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2';

export type RouteData = Data &
    (
        | { type: 'Leaf'; semanticIds?: string[]; idShortPaths?: string[] }
        | { type: 'Composition'; routes: string[] }
        | { type: 'Default' }
    );

export type ViewRoute = Route & { data: RouteData };

export const viewRoutes: ViewRoute[] = [
    {
        path: 'Browser',
        component: DocumentBrowserComponent,
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
        path: 'ContactInformations',
        component: ContactInformationsView,
        data: {
            type: 'Leaf',
            semanticIds: [CONTACT_INFORMATIONS_1_0],
        },
    },
    {
        path: 'CustomerFeedback',
        component: CustomerFeedbackComponent,
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
            idShortPaths: ['OperationalData'],
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

/**
 * Returns the route that corresponds to the specified Submodel, AAS document or AAS environment.
 * @param arg The current Submodel, AAS document or AAS environment.
 * @returns The route or `undefined`.
 */
export function findRoute(arg: aas.Submodel | AASDocument | aas.Environment): ViewRoute | undefined {
    let route: ViewRoute | undefined;
    if (isSubmodel(arg)) {
        route = findRouteForSubmodel(arg);
    } else {
        const env = isEnvironment(arg) ? arg : arg.content;
        if (!env) {
            return undefined;
        }

        route = findCompositionRoute(env);
    }

    return route ?? viewRoutes.find(item => item.data.type === 'Default');

    function findRouteForSubmodel(submodel: aas.Submodel): ViewRoute | undefined {
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

            if (route.data.idShortPaths) {
                for (const idShortPath of route.data.idShortPaths) {
                    if (getReferable(submodel, idShortPath)) {
                        return route;
                    }
                }
            }
        }

        return undefined;
    }

    function findCompositionRoute(env: aas.Environment): ViewRoute | undefined {
        const leafRoutes = new Map<string, ViewRoute>(
            viewRoutes.filter(route => route.data.type === 'Leaf').map(route => [route.path!, route]),
        );

        const submodelSemanticIds = new Set<string>(
            env.submodels.map(submodel => getSemanticId(submodel)).filter(semantic => semantic !== undefined),
        );

        for (const route of viewRoutes) {
            if (route.data.type !== 'Composition') {
                continue;
            }

            for (const path of route.data.routes) {
                const leafRoute = leafRoutes.get(path);
                if (!leafRoute) {
                    return undefined;
                }

                if (leafRoute.data.type === 'Leaf') {
                    const data = leafRoute.data;
                    if (data.semanticIds && data.semanticIds.length) {
                        if (!data.semanticIds.some(semanticId => submodelSemanticIds.has(semanticId))) {
                            return undefined;
                        }
                    }

                    if (data.idShortPaths) {
                        if (
                            !data.idShortPaths.some(idShortPath =>
                                env.submodels.some(submodel => getReferable(submodel, idShortPath) !== undefined),
                            )
                        ) {
                            return undefined;
                        }
                    }
                }

                return route;
            }
        }

        return undefined;
    }
}

/**
 * Determine whether the specified Submodel, AAS document or AAS environment has a specific view.
 * @param arg The current Submodel, AAS document or AAS environment.
 * @returns `true` if a specific view exists; otherwise; `false`.
 */
export function hasSpecificView(arg: aas.Submodel | AASDocument | aas.Environment): boolean {
    const route = findRoute(arg);
    return route !== undefined && route.data.type !== 'Default';
}
