/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { HttpClient, } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AASCursor, AASDocument, AASEndpoint, AASPage, aas } from 'common';
import { encodeBase64Url } from 'projects/aas-lib/src/public-api';

/** The client side AAS provider service. */
@Injectable({
    providedIn: 'root'
})
export class StartApiService {
    constructor(
        private readonly http: HttpClient,
    ) {}

    /**
    * Returns all configured AAS endpoints.
    * @returns An array of `AASContainer`.
    */
    public getEndpoints(): Observable<AASEndpoint[]> {
        return this.http.get<AASEndpoint[]>('/api/v1/endpoints');
    }

    /**
     * Adds a new endpoint to the AASServer configuration.
     * @param endpoint The AAS container endpoint.
     */
    public addEndpoint(endpoint: AASEndpoint): Observable<void> {
        return this.http.post<void>(`/api/v1/endpoints/${endpoint.name}`, endpoint);
    }

    /**
     * Removes the specified endpoint from the AASServer configuration.
     * @param name The name of the endpoint.
     */
    public removeEndpoint(name: string): Observable<void> {
        return this.http.delete<void>(`/api/v1/endpoints/${name}`);
    }

    /** Restores the default AAS endpoint configuration. */
    public reset(): Observable<void> {
        return this.http.delete<void>('/api/v1/endpoints');
    }

    /**
     * Delete the specified AAS document from the corresponding AAS container.
     * @param id The identification of the AAS document to delete.
     * @param url The URL of the AAS container.
     * @returns An observable.
     */
    public delete(id: string, url: string): Observable<void> {
        return this.http.delete<void>(
            `/api/v1/containers/${encodeBase64Url(url)}/packages/${encodeBase64Url(id)}`);
    }
    
    /**
     * Returns a page of documents from the specified cursor.
     * @param cursor The current cursor.
     * @param filter A filter expression.
     * @param language The language to used for the filter.
     * @returns The document page.
     */
    public getPage(cursor: AASCursor, filter?: string, language?: string): Observable<AASPage> {
        let url = `/api/v1/documents?cursor=${encodeBase64Url(JSON.stringify(cursor))}`;
        if (filter) {
            url += `&filter=${encodeBase64Url(filter)}`;
            if (language) {
                url += `&language=${language}`;
            }
        }

        return this.http.get<AASPage>(url);
    }

    /**
     * Loads the element structure of the specified document.
     * @param endpointName The URL of the container.
     * @param id The identification of the AAS document.
     * @returns The root of the element structure.
     */
    public getContent(endpointName: string, id: string): Observable<aas.Environment> {
        return this.http.get<aas.Environment>(
            `/api/v1/containers/${encodeBase64Url(endpointName)}/documents/${encodeBase64Url(id)}/content`);
    }

    /**
     * 
     * @param endpointName 
     * @param id 
     * @returns 
     */
    public getHierarchy(endpointName: string, id: string): Observable<AASDocument[]> {
        return this.http.get<AASDocument[]>(
            `/api/v1/containers/${encodeBase64Url(endpointName)}/documents/${encodeBase64Url(id)}/hierarchy`);
    }
}