/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { aas, AASDocument, AuthResult } from 'common';
import { encodeBase64Url } from '../convert';

/** The client side AAS provider service. */
@Injectable({
    providedIn: 'root',
})
export class AASTreeApiService {
    public constructor(private readonly http: HttpClient) {}

    public getTokenAsync(url: string): Promise<string> {
        return new Promise<string>((result, reject) => {
            let data: AuthResult;
            this.http.post<AuthResult>('/api/v1/login', { id: url }).subscribe({
                next: value => (data = value),
                complete: () => result(data.token),
                error: error => reject(error),
            });
        });
    }

    /**
     * Calls an operation.
     * @param document The document to which the operation belongs.
     * @param operation The operation to call.
     * @returns The result of the operation call.
     */
    public invoke(document: AASDocument, operation: aas.Operation): Promise<aas.Operation> {
        return new Promise<aas.Operation>((result, reject) => {
            let data: aas.Operation;
            this.http
                .post<aas.Operation>(
                    `/api/v1/containers/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(
                        document.id,
                    )}`,
                    operation,
                )
                .subscribe({
                    next: value => (data = value),
                    complete: () => result(data),
                    error: error => reject(error),
                });
        });
    }
}
