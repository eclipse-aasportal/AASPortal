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

/** Provides a specific view of a submodel. */
export abstract class View {
    /**
     * Creates a new instance of a derived `View` class.
     * @param route The activated route.
     * @param api The endpoint API.
     */
    protected constructor(
        private readonly route: ActivatedRoute,
        private readonly api: EndpointsApi,
    ) {}

    /** A list of expected semantic identifiers. */
    protected abstract get expectedSemanticIds(): string[];

    /** The available document-submodel tuples. */
    protected readonly tuples = signal<[AASDocument, aas.Submodel][]>([]);

    /** The current active document-submodel tuple. */
    protected readonly tuple = computed(() => this.tuples().at(this.index() - 1));

    /** The index of the current active document-submodel tuple. */
    public readonly index = signal(1);

    /** The number of document-submodel tuples. */
    public readonly count = computed(() => this.tuples().length);

    /** The current active AAS document. */
    public readonly document = computed(() => {
        const item = this.tuple();
        return item ? item[0] : undefined;
    });

    /** The thumbnail URL of the current active AAS document. */
    public readonly thumbnail = computed(() => {
        const document = this.document();
        if (!document) {
            return '';
        }

        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/thumbnail`;
    });

    /** The current active submodel. */
    public readonly submodel = computed(() => {
        const item = this.tuple();
        return item ? item[1] : undefined;
    });

    /** The version of the current active submodel. */
    public readonly version = computed(() => {
        const item = this.tuple();
        if (!item) {
            return undefined;
        }

        const submodel = item[1];
        const version = submodel.administration?.version;
        const revision = submodel.administration?.revision;
        if (version) {
            return revision ? `${version}.${revision}` : `${version}`;
        }

        return undefined;
    });

    /** ToDo: */
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
                this.tuples.set([...this.filterSubmodels(documents)]);
            });
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
