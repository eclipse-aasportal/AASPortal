/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { catchError, filter, from, map, mergeMap, Observable, of, tap, toArray } from 'rxjs';
import { aas, getSemanticId, PagedResult, traverse } from 'aas-core';
import { API_URL, CacheService, encodeBase64Url } from 'aas-lib';

import { Cursor } from '../types';

/** The AASServer API. */
@Injectable({ providedIn: 'root' })
export class AASApi {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = inject(API_URL);
    private readonly cache = inject(CacheService);

    /** The identifier of the AAS to get the environment. */
    public readonly aasId = signal<string | undefined>(undefined);

    /** The current AAS environment. */
    public readonly env = rxResource({
        params: this.aasId,
        stream: ({ params }) =>
            this.getValue<aas.AssetAdministrationShell>(`shells/${params}`).pipe(
                map(aas => {
                    const smIds: string[] = [];
                    if (aas.submodels) {
                        for (const ref of aas.submodels) {
                            const smId = ref.keys.at(0);
                            if (smId !== undefined) {
                                smIds.push(smId.value);
                            }
                        }
                    }

                    return { aas, smIds };
                }),
                mergeMap(({ aas, smIds }) => {
                    return from(smIds).pipe(
                        mergeMap(smId => this.getValue<aas.Submodel>(`submodels/${encodeBase64Url(smId)}`)),
                        toArray(),
                        mergeMap(submodels =>
                            from(this.getSemanticIds(submodels)).pipe(
                                mergeMap(id =>
                                    this.getValueOrNull<aas.ConceptDescription>(
                                        `concept-descriptions/${encodeBase64Url(id)}`,
                                    ),
                                ),
                                filter(value => value !== null),
                                toArray(),
                                map(conceptDescriptions => ({ submodels, conceptDescriptions })),
                            ),
                        ),
                        map(({ submodels, conceptDescriptions }) => {
                            return {
                                assetAdministrationShells: [aas],
                                submodels,
                                conceptDescriptions,
                            } satisfies aas.Environment;
                        }),
                    );
                }),
            ),
    });

    public getShells(cursor: Cursor | undefined, limit: number): Observable<PagedResult<aas.AssetAdministrationShell>> {
        const params: Record<string, string> = { limit: limit.toString() };
        if (cursor) {
            params['cursor'] = encodeBase64Url(JSON.stringify(cursor));
        }

        return this.getValue<PagedResult<aas.AssetAdministrationShell>>('shells', params);
    }

    private getValue<T>(url: string, queryParams?: Record<string, string>): Observable<T> {
        url = this.apiUrl.join(url, queryParams);
        const value = this.cache.get<T>(url);
        if (value) {
            return of(value);
        }

        return this.http.get<T>(url).pipe(tap(value => this.cache.set(url, value)));
    }

    private getValueOrNull<T>(url: string): Observable<T | null> {
        url = this.apiUrl.join(url);
        const value = this.cache.get<T>(url);
        if (value) {
            return of(value);
        }

        return this.http.get<T>(url).pipe(
            catchError(() => of(null)),
            tap(value => this.cache.set(url, value)),
        );
    }

    private getSemanticIds(submodels: aas.Submodel[]): string[] {
        const ids: string[] = [];
        for (const submodel of submodels) {
            for (const referable of traverse(submodel)) {
                const id = getSemanticId(referable);
                if (id) {
                    ids.push(id);
                }
            }
        }

        return ids;
    }
}
