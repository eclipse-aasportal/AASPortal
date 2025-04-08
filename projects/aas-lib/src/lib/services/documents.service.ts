/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AASCursor, AASDocument, AASPagedResult, aas } from 'aas-core';
import { first, mergeMap, Observable, of, switchMap, tap } from 'rxjs';
import { encodeBase64Url } from '../utilities';
import { AuthService } from '../auth/auth.service';
import { CacheService } from './cache.service';

/** The API of the digital nameplate. */
@Injectable({ providedIn: 'root' })
export class DocumentsService {
    public constructor(
        private readonly http: HttpClient,
        private readonly auth: AuthService,
        private readonly cache: CacheService,
    ) {}

    /**
     * Gets the AAS document with the specified identifier.
     * @param id The AAS identifier.
     * @param endpoint The endpoint name.
     * @returns The requested AAS document.
     */
    public getDocument(id: string, endpoint?: string): Observable<AASDocument> {
        return this.auth.userId.pipe(
            first(userId => userId !== undefined),
            mergeMap(() => {
                const url = endpoint
                    ? `/api/v1/endpoints/${encodeBase64Url(endpoint)}/documents/${encodeBase64Url(id)}`
                    : `/api/v1/documents/${encodeBase64Url(id)}`;

                const document: AASDocument | undefined = this.cache.get(url);
                if (document === undefined) {
                    return this.http.get<AASDocument>(url).pipe(tap(data => this.cache.set(url, data)));
                }

                return of(document);
            }),
        );
    }

    /**
     * Loads the element structure of the specified document.
     * @param endpoint The endpoint name.
     * @param id The identification of the AAS document.
     * @returns The root of the element structure.
     */
    public getContent(id: string, endpoint: string): Observable<aas.Environment> {
        const url = `/api/v1/endpoints/${encodeBase64Url(endpoint)}/documents/${encodeBase64Url(id)}/content`;
        const env: aas.Environment | undefined = this.cache.get(url);
        if (env === undefined) {
            return this.http.get<aas.Environment>(url).pipe(tap(data => this.cache.set(url, data)));
        }

        return of(env);
    }

    /**
     * Applies a changed AAS document.
     * @param document The document to apply.
     */
    public putDocument(document: AASDocument): Observable<string[]> {
        const formData = new FormData();
        formData.append('content', new Blob([JSON.stringify(document.content)]));
        return this.http.put<string[]>(
            `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}`,
            formData,
        );
    }

    /**
     * Returns a page of documents from the specified cursor.
     * @param cursor The current cursor.
     * @param filter A filter expression.
     * @param language The language to used for the filter.
     * @returns The document page.
     */
    public getPage(cursor: AASCursor, filter?: string, language?: string): Observable<AASPagedResult> {
        let url = `/api/v1/documents?cursor=${encodeBase64Url(JSON.stringify(cursor))}`;
        if (filter) {
            url += `&filter=${encodeBase64Url(filter)}`;
            if (language) {
                url += `&language=${language}`;
            }
        }

        const result: AASPagedResult | undefined = this.cache.get(url);
        if (result === undefined) {
            return this.http.get<AASPagedResult>(url).pipe(tap(data => this.cache.set(url, data)));
        }

        return of(result);
    }

    /**
     * Returns a AAS document hierarchy.
     * @param id The identification of the root AAS document.
     * @param endpoint The endpoint name of the root AAS document.
     * @returns The descendants of the root AAS document and the root itself.
     */
    public getHierarchy(id: string, endpoint: string): Observable<AASDocument[]> {
        const url = `/api/v1/endpoints/${encodeBase64Url(endpoint)}/documents/${encodeBase64Url(id)}/hierarchy`;
        const documents: AASDocument[] | undefined = this.cache.get(url);
        if (documents === undefined) {
            return this.http.get<AASDocument[]>(url).pipe(tap(data => this.cache.set(url, data)));
        }

        return of(documents);
    }
}
