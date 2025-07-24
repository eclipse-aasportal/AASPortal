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
import { aas, AASDocument, getSemanticId } from 'aas-core';
import { decodeBase64Url, encodeBase64Url } from '../utilities';
import { EndpointsApi } from '../../public-api';

export abstract class View {
    protected constructor(
        private readonly route: ActivatedRoute,
        private readonly api: EndpointsApi,
    ) {}

    protected abstract get expectedSemanticIds(): string[];

    protected readonly items = signal<[AASDocument, aas.Submodel][]>([]);

    protected readonly item = computed(() => this.items().at(this.index() - 1));

    public readonly index = signal(1);

    public readonly document = computed(() => {
        const item = this.item();
        return item ? item[0] : undefined;
    });

    public readonly count = computed(() => this.items().length);

    public readonly thumbnail = computed(() => {
        const document = this.document();
        if (!document) {
            return '';
        }

        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/thumbnail`;
    });

    public readonly submodel = computed(() => {
        const env = this.document()?.content;
        if (!env) {
            return undefined;
        }

        return env.submodels.find(submodel => {
            const semanticId = getSemanticId(submodel);
            return semanticId && this.expectedSemanticIds.indexOf(semanticId) >= 0;
        });
    });

    public readonly version = computed(() => {
        const item = this.item();
        if (!item) {
            return undefined;
        }

        const submodel = item[1];
        const version = submodel.administration?.version;
        const revision = submodel.administration?.revision;
        if (version) {
            return revision ? `${version}.${revision}`: `${version}`;
        }

        return undefined;
    });

    protected init(): void {
        this.route.queryParams
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
                this.initialize(documents);
            });
    }

    private initialize(documents: AASDocument[]) {
        this.items.set([...this.filterSubmodels(documents)]);
    }

    private *filterSubmodels(documents: AASDocument[]): Generator<[AASDocument, aas.Submodel]> {
        for (const document of documents) {
            if (!document.content) {
                continue;
            }

            for (const submodel of document.content.submodels) {
                const semanticId = getSemanticId(submodel);
                if (semanticId && this.expectedSemanticIds.indexOf(semanticId) >= 0) {
                    yield [document, submodel];
                }
            }
        }
    }
}
