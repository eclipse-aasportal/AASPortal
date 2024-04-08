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
export class AASApiService {
    public constructor(private readonly http: HttpClient) {}

    /**
     * Gets the AAS document with the specified identifier.
     * @param id The AAS identifier.
     * @param name The AAS container name.
     * @returns The requested AAS document.
     */
    public getDocument(id: string, name?: string): Observable<AASDocument> {
        if (name) {
            return this.http.get<AASDocument>(
                `/api/v1/containers/${encodeBase64Url(name)}/documents/${encodeBase64Url(id)}`,
            );
        }

        return this.http.get<AASDocument>(`/api/v1/documents/${encodeBase64Url(id)}`);
    }

    /**
     * Applies a changed AAS document.
     * @param document The document to apply.
     */
    public putDocument(document: AASDocument): Observable<string[]> {
        const formData = new FormData();
        formData.append('content', new Blob([JSON.stringify(document.content)]));
        return this.http.put<string[]>(
            `/api/v1/containers/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}`,
            formData,
        );
    }
}
