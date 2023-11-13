/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { HttpClient, } from '@angular/common/http';
import { AASEndpoint } from 'common';
import { Observable } from 'rxjs';
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
    public deleteDocument(id: string, url: string): Observable<void> {
        return this.http.delete<void>(
            `/api/v1/containers/${encodeBase64Url(url)}/documents/${encodeBase64Url(id)}`);
    }
}