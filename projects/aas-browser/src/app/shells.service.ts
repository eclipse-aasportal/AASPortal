/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { Injectable, signal, inject } from '@angular/core';
import { aas, PagedResult } from 'aas-core';
import { API_URL, encodeBase64Url } from 'aas-lib';

import { Cursor } from './types';

@Injectable({
    providedIn: 'root',
})
export class ShellsService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = inject(API_URL);

    public readonly limit = signal(30);

    public readonly cursor = signal<Cursor | undefined>(undefined);

    public readonly shells = rxResource({
        params: () => ({
            limit: this.limit(),
            cursor: this.cursor(),
        }),
        stream: options => {
            const params: Record<string, string> = {};
            if (options.params.cursor) {
                params['cursor'] = encodeBase64Url(JSON.stringify(options.params.cursor));
                params['limit'] = options.params.limit.toString();
            }

            return this.http.get<PagedResult<aas.AssetAdministrationShell>>(this.apiUrl.join('shells', params));
        },
    });
}
