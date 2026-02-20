/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DOCUMENT, inject, Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { AASCursor, AASDocument, AASEndpoint, AASPagedResult, aas } from 'aas-core';
import { first, map, mergeMap, Observable, of, tap } from 'rxjs';
import { encodeBase64Url } from '../utilities';
import { AuthService } from '../components/auth/auth.service';
import { CacheService } from './cache.service';

/** The API of the digital nameplate. */
@Injectable({ providedIn: 'root' })
export class EndpointsApi {
    private readonly document = inject(DOCUMENT);
    private readonly http = inject(HttpClient);
    private readonly auth = inject(AuthService);
    private readonly cache = inject(CacheService);

    /**
     * Returns all configured AAS endpoints.
     * @returns An array of `AASEndpoint`.
     */
    public getEndpoints(): Observable<AASEndpoint[]> {
        return this.http.get<AASEndpoint[]>('/api/v1/endpoints');
    }

    /**
     * Adds a new endpoint.
     * @param endpoint The AAS endpoint.
     */
    public addEndpoint(endpoint: AASEndpoint): Observable<void> {
        return this.http.post<void>('/api/v1/endpoints', endpoint);
    }

    /**
     * Updates an existing endpoint.
     * @param endpoint The AAS endpoint.
     */
    public updateEndpoint(endpoint: AASEndpoint): Observable<void> {
        return this.http.put<void>(`/api/v1/endpoints/${encodeBase64Url(endpoint.name)}`, endpoint);
    }

    /**
     * Removes the specified endpoint.
     * @param name The name of the endpoint.
     */
    public removeEndpoint(name: string): Observable<void> {
        return this.http.delete<void>(`/api/v1/endpoints/${encodeBase64Url(name)}`);
    }

    /**
     * Gets the AAS document with the specified identifier.
     * @param modelType The model type to which the identifier belongs.
     * @param id Depending of the model type the AAS or Asset identifier.
     * @param endpoint The endpoint name.
     * @returns The requested AAS document.
     */
    public getDocument(
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
        endpoint?: string,
    ): Observable<AASDocument> {
        return this.auth.ready.pipe(
            first(ready => ready === true),
            mergeMap(() => {
                const url = endpoint
                    ? modelType === 'AssetAdministrationShell'
                        ? `/api/v1/endpoints/${encodeBase64Url(endpoint)}/documents/${encodeBase64Url(id)}`
                        : `/api/v1/endpoints/${encodeBase64Url(endpoint)}/documents/asset/${encodeBase64Url(id)}`
                    : modelType === 'AssetAdministrationShell'
                      ? `/api/v1/documents/${encodeBase64Url(id)}`
                      : `/api/v1/documents/asset/${encodeBase64Url(id)}`;

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
     * Updates an existing document for a specific endpoint by sending its content to the server.
     *
     * @param document - The `AASDocument` object containing the endpoint, document ID, and content to be updated.
     * @returns An `Observable<void>` that completes when the update operation is successful.
     * @throws Error if the document content is null or undefined.
     */
    public putDocument(document: AASDocument): Observable<void> {
        if (!document.content) {
            throw new Error('Document content is null or undefined.');
        }

        return this.http.put<void>(
            `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}`,
            document.content,
        );
    }

    /**
     * Retrieves a paginated list of documents from the API, optionally filtered and localized.
     *
     * @param cursor The pagination cursor object used to fetch the desired page of results.
     * @param filter (Optional) A filter string to narrow down the documents returned.
     * @param language (Optional) The language code to localize the documents.
     * @returns An Observable emitting the paginated result of documents. If the result is cached, returns the cached value as an Observable.
     */
    public getDocuments(cursor: AASCursor, filter?: string, language?: string): Observable<AASPagedResult> {
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
     * Delete the specified AAS document from the corresponding AAS container.
     * @param id The identification of the AAS document to delete.
     * @param url The URL of the AAS container.
     * @returns An observable.
     */
    public deleteDocument(id: string, url: string): Observable<void> {
        return this.http.delete<void>(`/api/v1/endpoints/${encodeBase64Url(url)}/packages/${encodeBase64Url(id)}`);
    }

    /**
     * Downloads a file from the specified URL.
     * @param url The URL to the file resource.
     * @param filename The file name.
     */
    public download(url: string, filename: string): Observable<void> {
        return this.http
            .get(url, {
                responseType: 'blob',
            })
            .pipe(
                map(blob => {
                    const a = this.document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.setAttribute('download', filename);
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
                }),
            );
    }

    /**
     * Downloads an AASX package file from the specified endpoint for the given AAS identifier.
     *
     * @param endpoint The endpoint name used to form the request URL.
     * @param id The identifier for the AAS whose package will be downloaded.
     * @param filename The name used for the downloaded file in the browser.
     * @returns An Observable that completes after the download is triggered.
     */
    public downloadPackage(endpoint: string, id: string, filename: string): Observable<void> {
        return this.http
            .get(`/api/v1/endpoints/${encodeBase64Url(endpoint)}/packages/${encodeBase64Url(id)}`, {
                responseType: 'blob',
            })
            .pipe(
                map(blob => {
                    const a = this.document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.setAttribute('download', filename);
                    a.click();
                    URL.revokeObjectURL(a.href);
                }),
            );
    }

    /**
     * Uploads an AASX package file to the specified endpoint.
     * This method sends a multipart/form-data POST request containing the provided
     * file to the server. The request reports progress and emits events describing
     * the upload process. The file is appended to the form data under the key 'file'.
     *
     * @param endpoint The endpoint name used to construct the upload URL.
     * @param file The File object to be uploaded.
     * @returns An Observable emitting HttpEvent<object> for upload progress and completion.
     */
    public uploadPackage(endpoint: string, file: File): Observable<HttpEvent<object>> {
        const data = new FormData();
        data.append('file', file);
        return this.http.post(`/api/v1/endpoints/${encodeBase64Url(endpoint)}/packages`, data, {
            reportProgress: true,
            observe: 'events',
        });
    }
}
