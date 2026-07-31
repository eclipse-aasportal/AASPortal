/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, computed } from '@angular/core';
import { Params } from '@angular/router';
import { combineLatest, first, from, map, mergeMap, Observable, of, toArray } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { aas, AASDocument, getDocumentStatus, getSemanticId, isEnvironment } from 'aas-core';
import { decodeBase64Url } from '../utilities';
import { View } from './view';

@Component({ selector: 'awp-leaf-view', template: '' })
export abstract class LeafView extends View {
    private readonly tuple = computed(() => this.tuples().at(this.index() - 1));

    /**
     * The current active AAS document.
     */
    public override readonly document = computed(() => {
        const item = this.tuple();
        return item ? item[0] : undefined;
    });

    /**
     * The number of available AAS documents.
     */
    public override readonly count = computed(() => this.tuples().length);

    /**
     * The version of the current active submodel.
     */
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

    /**
     * The current active submodel.
     */
    public readonly submodel = computed(() => {
        const item = this.tuple();
        return item ? item[1] : undefined;
    });

    /**
     * A reactive signal containing an array of filtered document tuples.
     *
     * This signal is derived from the current route parameters and is populated as follows:
     * - If the route contains an `id`, it fetches a single document using the decoded `id` and optional `endpoint`.
     * - If the route contains `docs`, it parses the decoded JSON array of `[endpoint, id]` pairs and fetches each document.
     * - If neither is present, it resolves to an empty array.
     *
     * The resulting documents are filtered using the `filter` method before being emitted.
     * The signal is initialized with an empty array.
     */
    protected readonly tuples = toSignal(
        combineLatest([this.route.params.pipe(first()), this.route.queryParams.pipe(first())]).pipe(
            map(([routeParams, queryParams]) => {
                return routeParams.id || routeParams.docs ? routeParams : queryParams;
            }),
            mergeMap(params => {
                return this.documentsFromParams(params);
            }),
            map(documents => {
                return [...this.filter(documents)];
            }),
        ),
        { initialValue: [] },
    );

    private documentsFromParams(params: Params): Observable<AASDocument[]> {
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

        return of([]);
    }

    private *filter(documents: AASDocument[]): Generator<[AASDocument, aas.Submodel]> {
        for (const document of documents) {
            if (getDocumentStatus(document) !== 'loaded') {
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
        if (!env || !env.submodels) {
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
