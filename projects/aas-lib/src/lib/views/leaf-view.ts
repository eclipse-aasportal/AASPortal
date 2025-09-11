/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, Signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first, from, mergeMap, of, toArray } from 'rxjs';

import { aas, AASDocument, getSemanticId, isEnvironment } from 'aas-core';
import { decodeBase64Url } from '../utilities';
import { EndpointsApi } from '../services/endpoints-api';
import { ViewRoute, ViewRouteName } from '../types';
import { View } from './view';
import { LeafViewData, LeafViewState } from './leaf-view-state';

/**
 * Represents a specific view for a submodel.
 */
export abstract class LeafView<TState extends LeafViewState<LeafViewData>> extends View {
    private readonly tuple = computed(() => this.tuples().at(this.index() - 1));

    protected constructor(
        route: ActivatedRoute,
        api: EndpointsApi,
        viewRoutes: ViewRoute[],
        viewRouteName: ViewRouteName,
        protected readonly state: TState,
    ) {
        super(route, api, viewRoutes, viewRouteName);

        this.tuples = this.state.tuples;
    }

    /** The current active AAS document. */
    public override readonly document = computed(() => {
        const item = this.tuple();
        return item ? item[0] : undefined;
    });

    /** The number of available AAS documents. */
    public override readonly count = computed(() => this.tuples().length);

    /** The version of the current active submodel. */
    public override readonly version = computed(() => {
        const item = this.tuple();
        if (!item) {
            return undefined;
        }

        const administration = item[1].administration;
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

    /** The current active submodel. */
    public readonly submodel = computed(() => {
        const item = this.tuple();
        return item ? item[1] : undefined;
    });

    /** The submodels and the corresponding AAS documents. */
    protected readonly tuples: Signal<[AASDocument, aas.Submodel][]>;

    /** Initializes the current view. */
    protected onInit(): void {
        this.route.params
            .pipe(
                first(),
                mergeMap(params => {
                    if (params.id) {
                        const endpoint = params.endpoint ? decodeBase64Url(params.endpoint) : undefined;
                        return this.api.getDocument(decodeBase64Url(params.id), endpoint).pipe(toArray());
                    }

                    if (params.docs) {
                        const docs: [string, string][] = JSON.parse(decodeBase64Url(params.docs));
                        return from(docs).pipe(
                            mergeMap(([endpoint, id]) => this.api.getDocument(id, endpoint)),
                            toArray(),
                        );
                    }

                    return of(undefined);
                }),
            )
            .subscribe(documents => {
                if (documents) {
                    this.state.update({ tuples: [...this.filter(documents)] });
                }
            });
    }

    private *filter(documents: AASDocument[]): Generator<[AASDocument, aas.Submodel]> {
        for (const document of documents) {
            if (!document.content) {
                continue;
            }

            const submodel = this.findSubmodel(document);
            if (submodel) {
                yield [document, submodel];
            }
        }
    }

    private findSubmodel(document: AASDocument): aas.Submodel | undefined {
        const env = isEnvironment(document) ? document : document.content;
        if (!env) {
            return undefined;
        }

        for (const submodel of env.submodels) {
            if (this.view.data.semanticIds) {
                const semanticId = getSemanticId(submodel);
                if (semanticId && this.view.data.semanticIds) {
                    if (this.view.data.semanticIds.indexOf(semanticId) >= 0) {
                        return submodel;
                    }
                }
            }

            if (this.view.data.idShorts) {
                for (const idShort of this.view.data.idShorts) {
                    if (submodel.idShort === idShort) {
                        return submodel;
                    }
                }
            }
        }

        return undefined;
    }
}
