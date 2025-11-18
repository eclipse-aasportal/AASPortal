/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, Signal } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { combineLatest, first, from, mergeMap, of, toArray, map, Observable } from 'rxjs';

import { aas, AASDocument, getReferable, getSemanticId } from 'aas-core';
import { decodeBase64Url } from '../utilities';
import { EndpointsApi } from '../services/endpoints-api';
import { ViewRoute, ViewRouteMap, ViewRouteName } from '../types';
import { View } from './view';
import { CompositeViewData, CompositeViewState } from './composite-view-state';

/** Provides a view for an Asset Asset Administration with a set of specific submodels. */
export abstract class CompositeView<TState extends CompositeViewState<CompositeViewData>> extends View {
    private readonly tuples: Signal<[AASDocument, ViewRouteMap][]>;

    protected constructor(
        route: ActivatedRoute,
        api: EndpointsApi,
        viewRoutes: ViewRoute[],
        viewRouteName: ViewRouteName,
        protected readonly state: TState,
    ) {
        super(route, api, viewRoutes, viewRouteName);

        this.tuples = state.tuples;
    }

    protected readonly tuple = computed(() => this.tuples().at(this.index() - 1));

    public override readonly document = computed(() => {
        const tuple = this.tuple();
        return tuple ? tuple[0] : undefined;
    });

    public readonly content = computed(() => {
        const content = this.document()?.content;
        if (!content) {
            return undefined;
        }

        return content;
    });

    /** Returns the version of the current AAS. */
    public override version = computed(() => {
        const tuple = this.tuple();
        if (!tuple) {
            return undefined;
        }

        const administration = tuple[0].content?.assetAdministrationShells.at(0)?.administration;
        if (!administration) {
            return undefined;
        }

        const version = administration?.version;
        const revision = administration?.revision;
        if (version) {
            return revision ? `${version}.${revision}` : `${version}`;
        }

        return undefined;
    });

    public override readonly count = computed(() => this.tuples().length);

    protected onInit(): void {
        combineLatest([this.route.params.pipe(first()), this.route.queryParams.pipe(first())])
            .pipe(
                map(([routeParams, queryParams]) => {
                    return routeParams.id || routeParams.docs ? routeParams : queryParams;
                }),
                mergeMap(params => this.documentsFromParams(params)),
                first(),
            )
            .subscribe(documents => {
                if (!documents) {
                    return;
                }

                const tuples: [AASDocument, ViewRouteMap][] = [...this.filter(documents)];
                this.state.update({ tuples });
            });
    }

    private documentsFromParams(params: Params): Observable<AASDocument[] | undefined> {
        if (params?.id) {
            const endpoint = params.endpoint ? decodeBase64Url(params.endpoint) : undefined;
            return this.api
                .getDocument('AssetAdministrationShell', decodeBase64Url(params.id), endpoint)
                .pipe(toArray());
        }

        if (params?.docs) {
            const docs: [string, string][] = JSON.parse(decodeBase64Url(params.docs));
            return from(docs).pipe(
                mergeMap(([endpoint, id]) => this.api.getDocument('AssetAdministrationShell', id, endpoint)),
                toArray(),
            );
        }

        return of(undefined);
    }

    private *filter(documents: AASDocument[]): Generator<[AASDocument, ViewRouteMap]> {
        for (const document of documents) {
            if (!document.content) {
                continue;
            }

            const map = this.findSubmodelMap(document);
            if (map) {
                yield [document, map];
            }
        }
    }

    private findSubmodelMap(document: AASDocument): ViewRouteMap | undefined {
        const env = document.content;
        if (!env) {
            return undefined;
        }

        if (this.view.data.type === 'Leaf') {
            return undefined;
        } else if (this.view.data.type === 'Default') {
            return {};
        }

        const leafRoutes = new Map<string, ViewRoute>(
            this.viewRoutes.filter(route => route.data.type === 'Leaf').map(route => [route.path!, route]),
        );

        const submodelSemanticIds = new Map<string, aas.Submodel>();
        for (const submodel of env.submodels) {
            const semanticId = getSemanticId(submodel);
            if (semanticId) {
                submodelSemanticIds.set(semanticId, submodel);
            }
        }

        const map: ViewRouteMap = {};
        for (const path of this.view.data.routes) {
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
}
