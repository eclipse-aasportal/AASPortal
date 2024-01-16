/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AASDocument } from 'common';
import { Observable } from 'rxjs';
import { encodeBase64Url } from 'projects/aas-lib/src/public-api';

/** The client side AAS provider service. */
@Injectable({
    providedIn: 'root',
})
export class MainApiService {
    public constructor(private readonly http: HttpClient) {}

    /**
     * Gets the first AAS with the specified identifier.
     * @param id The identification or name of the document.
     * @returns The AAS document.
     */
    public getDocument(id: string): Observable<AASDocument> {
        return this.http.get<AASDocument>(`/api/v1/documents/${encodeBase64Url(id)}`);
    }
}
