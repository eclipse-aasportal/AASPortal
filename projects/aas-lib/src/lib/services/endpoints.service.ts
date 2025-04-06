/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AASEndpoint } from 'aas-core';
import { encodeBase64Url } from '../utilities';

/** AAS endpoint service. */
@Injectable({
    providedIn: 'root',
})
export class EndpointsService {
    public constructor(private readonly http: HttpClient) {}

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
        return this.http.post<void>(`/api/v1/endpoints/${encodeBase64Url(endpoint.name)}`, endpoint);
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
     * Delete the specified AAS document from the corresponding AAS container.
     * @param id The identification of the AAS document to delete.
     * @param url The URL of the AAS container.
     * @returns An observable.
     */
    public delete(id: string, url: string): Observable<void> {
        return this.http.delete<void>(`/api/v1/endpoints/${encodeBase64Url(url)}/packages/${encodeBase64Url(id)}`);
    }
}
