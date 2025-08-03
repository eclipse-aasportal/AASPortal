/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first, from, mergeMap, of, toArray } from 'rxjs';

import { AASDocument } from 'aas-core';
import { decodeBase64Url } from '../utilities';
import { EndpointsApi } from '../services/endpoints-api';
import { ViewRouteMap, ViewRouteName } from '../types';
import { findSubmodelMap, View, viewRoutes } from '../internal';

/** Provides a view for an Asset Asset Administration with a set of specific submodells. */
export abstract class CompositeView extends View {
    private readonly tuples = signal<[AASDocument, ViewRouteMap][]>([]);

    protected constructor(route: ActivatedRoute, api: EndpointsApi, expectedRoute: ViewRouteName) {
        super(route, api, expectedRoute);
    }

    protected readonly tuple = computed(() => this.tuples().at(this.index() - 1));

    public override readonly document = computed(() => {
        const item = this.tuple();
        return item ? item[0] : undefined;
    });

    /** Returns the verion of the current AAS. */
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
        this.route.params
            .pipe(
                first(),
                mergeMap(params => {
                    if (params.id) {
                        const endpoint = params.endpoint ? decodeBase64Url(params.endpoint) : undefined;
                        return this.api.getDocument(decodeBase64Url(params.id), endpoint).pipe(toArray());
                    }

                    if (!params.docs) {
                        return of([]);
                    }

                    const docs: [string, string][] = JSON.parse(decodeBase64Url(params.docs));
                    return from(docs).pipe(
                        mergeMap(([endpoint, id]) => this.api.getDocument(id, endpoint)),
                        toArray(),
                    );
                }),
            )
            .subscribe(documents => {
                this.tuples.set([...this.filter(documents)]);
            });
    }

    private *filter(documents: AASDocument[]): Generator<[AASDocument, ViewRouteMap]> {
        const route = viewRoutes.find(item => item.path === this.expectedRoute);
        if (!route || route.data.type === 'Leaf') {
            return;
        }

        for (const document of documents) {
            if (!document.content) {
                continue;
            }

            const map = findSubmodelMap(document, route);
            if (map) {
                yield [document, map];
            }
        }
    }
}
