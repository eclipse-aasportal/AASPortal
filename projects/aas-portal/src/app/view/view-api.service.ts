/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AASDocument } from 'common';
import { Observable } from 'rxjs';
import { encodeBase64Url } from 'aas-lib';

/** The client side AAS provider service. */
@Injectable({
    providedIn: 'root',
})
export class ViewApiService {
    public constructor(private readonly http: HttpClient) {}

    /**
     * Gets the referenced AAS document.
     * @param endpoint The endpoint name.
     * @param id The AAS identification.
     * @returns The AAS document.
     */
    public getDocument(endpoint: string, id: string): Observable<AASDocument> {
        return this.http.get<AASDocument>(
            `/api/v1/containers/${encodeBase64Url(endpoint)}/documents/${encodeBase64Url(id)}`,
        );
    }
}
