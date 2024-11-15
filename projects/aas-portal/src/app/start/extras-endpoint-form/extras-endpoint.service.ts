/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AASEndpoint } from 'aas-core';
import { encodeBase64Url } from 'aas-lib';

@Injectable()
export class ExtrasEndpointService {
    public constructor(private readonly http: HttpClient) {}

    /**
     * Returns all configured AAS endpoints.
     * @returns An array of `AASContainer`.
     **/
    public getEndpoints(): Observable<AASEndpoint[]> {
        return this.http.get<AASEndpoint[]>('/api/v1/endpoints');
    }

    /**
     * Restores the default AAS endpoint configuration.
     **/
    public reset(): Observable<void> {
        return this.http.delete<void>('/api/v1/endpoints');
    }

    /**
     * Gets the total amount of documents contained in the endpoint with the specified name.
     * @param endpointName The name of the endpoint.
     **/
    public getDocumentCount(endpointName: string): Observable<number> {
        return this.http
            .get<{ count: number }>(`/api/v1/endpoints/${encodeBase64Url(endpointName)}/documents/count`)
            .pipe(map(value => value.count));
    }

    /**
     * Starts an update of the endpoint index.
     * @param endpointName The name of the endpoint.
     **/
    public scan(endpointName: string): Observable<void> {
        return this.http.put<void>(`/api/v1/endpoints/${encodeBase64Url(endpointName)}/scan`, null);
    }
}
