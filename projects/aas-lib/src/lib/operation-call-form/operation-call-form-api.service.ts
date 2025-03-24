/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { aas, AASDocument } from 'aas-core';
import { encodeBase64Url } from '../convert';
import { Observable } from 'rxjs';

/** The client side AAS provider service. */
@Injectable()
export class OperationCallFormApiService {
    public constructor(private readonly http: HttpClient) {}

    /**
     * Calls an operation.
     * @param document The document to which the operation belongs.
     * @param operation The operation to call.
     * @returns The result of the operation call.
     */
    public invoke(document: AASDocument, operation: aas.Operation): Observable<aas.Operation> {
        const endpoint = encodeBase64Url(document.endpoint);
        const id = encodeBase64Url(document.id);
        return this.http.post<aas.Operation>(`/api/v1/endpoints/${endpoint}/documents/${id}/invoke`, operation);
    }
}
