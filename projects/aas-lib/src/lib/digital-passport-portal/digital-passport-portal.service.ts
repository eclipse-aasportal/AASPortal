/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AASDocument, aas } from 'aas-core';
import { Observable } from 'rxjs';
import { encodeBase64Url } from '../convert';

/** The client side AAS provider service. */
@Injectable()
export class DigitalPassportPortalService {
    public constructor(private readonly http: HttpClient) {}

    /**
     * Gets the AAS document with the specified identifier.
     * @param id The AAS identifier.
     * @param endpoint The endpoint name.
     * @returns The requested AAS document.
     */
    public getDocument(id: string, endpoint?: string): Observable<AASDocument> {
        if (endpoint) {
            return this.http.get<AASDocument>(
                `/api/v1/endpoints/${encodeBase64Url(endpoint)}/documents/${encodeBase64Url(id)}`,
            );
        }

        return this.http.get<AASDocument>(`/api/v1/documents/${encodeBase64Url(id)}`);
    }

    /**
     * Loads the element structure of the specified document.
     * @param endpoint The endpoint name.
     * @param id The identification of the AAS document.
     * @returns The root of the element structure.
     */
    public getContent(id: string, endpoint: string): Observable<aas.Environment> {
        return this.http.get<aas.Environment>(
            `/api/v1/endpoints/${encodeBase64Url(endpoint)}/documents/${encodeBase64Url(id)}/content`,
        );
    }
}
