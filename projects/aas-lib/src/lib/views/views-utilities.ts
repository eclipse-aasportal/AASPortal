/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument, getReferable, getSemanticId, isEnvironment, isSubmodel } from 'aas-core';
import { ViewRoute, ViewRouteMap, ViewRouteResult } from '../types';
import { viewRoutes } from './views-routes';

/**
 * Returns the route that corresponds to the specified Submodel.
 * @param arg The current Submodel.
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

/**
 * Returns the submodel that belongs to a specific view.
 * @param arg The current AAS document or AAS environment
 * @param route The route that represents a specific view.
 * @returns The submodel or `undefined`.
 */
export function findSubmodel(arg: AASDocument | aas.Environment, route: ViewRoute): aas.Submodel | undefined {
    if (route.data.type !== 'Leaf') {
        return undefined;
    }

    const env = isEnvironment(arg) ? arg : arg.content;
    if (!env) {
        return undefined;
    }

    for (const submodel of env.submodels) {
        if (route.data.semanticIds) {
            const semanticId = getSemanticId(submodel);
            if (semanticId && route.data.semanticIds) {
                if (route.data.semanticIds.indexOf(semanticId) >= 0) {
                    return submodel;
                }
            }
        }

        if (route.data.idShorts) {
            for (const idShort of route.data.idShorts) {
                if (submodel.idShort === idShort) {
                    return submodel;
                }
            }
        }
    }

    return undefined;
}

/**
 * Returns the submodels that belong to the specified composite view.
 * @param arg The current AAS document or environment.
 * @param route The route that represents a specific view.
 * @returns The submodles that belong to the specified route or `undefined`.
 */
export function findSubmodelMap(arg: AASDocument | aas.Environment, route: ViewRoute): ViewRouteMap | undefined {
    const env = isEnvironment(arg) ? arg : arg.content;
    if (!env) {
        return undefined;
    }

    if (route.data.type === 'Leaf') {
        return undefined;
    } else if (route.data.type === 'Default') {
        return {};
    }

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
    for (const path of route.data.routes) {
        const leafRoute = leafRoutes.get(path);
        if (!leafRoute) {
            return undefined;
        }

        if (leafRoute.data.type !== 'Leaf') {
            continue;
        }

        const data = leafRoute.data;
        if (data.semanticIds && data.semanticIds.length) {
            const semanticId = data.semanticIds.find(id => submodelSemanticIds.has(id));
            if (!semanticId) {
                return undefined;
            }

            const submodel = submodelSemanticIds.get(semanticId);
            if (!submodel) {
                return undefined;
            }

            map[leafRoute.path!] = submodel;
        }

        if (data.idShorts) {
            let submodel: aas.Submodel | undefined;
            for (const idShortPath of data.idShorts) {
                const submodel = env.submodels.find(submodel => getReferable(submodel, idShortPath) !== undefined);

                if (submodel) {
                    break;
                }
            }

            if (!submodel) {
                return undefined;
            }

            map[leafRoute.path!] = submodel;
        }
    }

    return map;
}
