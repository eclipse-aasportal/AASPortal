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

import { aas, AASDocument } from 'aas-core';
import { decodeBase64Url } from '../utilities';
import { EndpointsApi } from '../services/endpoints-api';
import { ViewRouteName } from '../types';
import { findSubmodel, View, viewRoutes } from '../internal';

/**  Represents a specific vire for a submodel. */
export abstract class LeafView extends View {
    private readonly tuple = computed(() => this.tuples().at(this.index() - 1));

    protected constructor(route: ActivatedRoute, api: EndpointsApi, expectedRoute: ViewRouteName) {
        super(route, api, expectedRoute);
    }

    public override readonly document = computed(() => {
        const item = this.tuple();
        return item ? item[0] : undefined;
    });

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

    /** */
    protected readonly tuples = signal<[AASDocument, aas.Submodel][]>([]);

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

    private *filter(documents: AASDocument[]): Generator<[AASDocument, aas.Submodel]> {
        const route = viewRoutes.find(item => item.path === this.expectedRoute);
        if (!route || route.data.type !== 'Leaf') {
            return;
        }

        for (const document of documents) {
            if (!document.content) {
                continue;
            }

            const submodel = findSubmodel(document, route);
            if (submodel) {
                yield [document, submodel];
            }
        }
    }
}
