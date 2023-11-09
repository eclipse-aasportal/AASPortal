/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AASDocument, TemplateDescriptor } from 'common';
import { Observable } from 'rxjs';
import { encodeBase64Url } from 'projects/aas-lib/src/public-api';

/** The client side AAS provider service. */
@Injectable({
    providedIn: 'root'
})
export class AASApiService {
    constructor(
        private readonly http: HttpClient
    ) {
    }

    /**
     * Gets the AAS document with the specified identifier.
     * @param id The AAS identifier.
     * @param url The AAS container URL.
     * @returns The requested AAS document.
     */
    public getDocument(id: string, url?: string): Observable<AASDocument> {
        if (url) {
            return this.http.get<AASDocument>(`/api/v1/containers/${encodeBase64Url(url)}/documents/${encodeBase64Url(id)}`);
        }

        return this.http.get<AASDocument>(`/api/v1/documents/${encodeBase64Url(id)}`);
    }

    /**
     * Gets the templates.
     * @returns An array of `TemplateDescriptor` items.
     */
    public getTemplates(): Observable<TemplateDescriptor[]> {
        return this.http.get<TemplateDescriptor[]>('/api/v1/templates');
    }

    /**
     * Applies a changed AAS document.
     * @param document The document to apply.
     */
    public putDocument(document: AASDocument): Observable<string[]> {
        const formData = new FormData();
        formData.append('content', new Blob([JSON.stringify(document.content)]));
        return this.http.put<string[]>(
            `/api/v1/containers/${encodeBase64Url(document.endpoint.url)}/documents/${encodeBase64Url(document.id)}`,
            formData);
    }
}