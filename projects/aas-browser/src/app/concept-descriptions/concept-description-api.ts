/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { aas, PagedResult } from 'aas-core';
import { API_URL, encodeBase64Url } from 'aas-lib';

import { Cursor } from '../types';

/** The AASServer API. */
@Injectable({ providedIn: 'root' })
export class ConceptDescriptionApi {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = inject(API_URL);

    /** The maximum items of a concept description page. */
    public readonly limit = signal(30);

    /** The position of the concept description page to get. */
    public readonly cursor = signal<Cursor | undefined>(undefined);

    /** The current concept description page. */
    public readonly conceptDescriptions = httpResource<PagedResult<aas.ConceptDescription>>(() => {
        const cursor = this.cursor();
        const params: Record<string, string> = { limit: this.limit().toString() };
        if (cursor) {
            params['cursor'] = encodeBase64Url(JSON.stringify(cursor));
        }

        return this.apiUrl.join('concept-descriptions', params);
    });

    /** The identifier of the concept description to get. */
    public readonly cdId = signal<string | undefined>(undefined);

    /** The current concept description. */
    public readonly conceptDescription = httpResource<aas.ConceptDescription>(() => {
        const cdId = this.cdId();
        if (!cdId) {
            return undefined;
        }

        return this.apiUrl.join(`concept-descriptions/${encodeBase64Url(cdId)}`);
    });
}
