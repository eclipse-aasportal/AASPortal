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
import { encodeBase64Url } from 'aas-lib';

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
        formData.append('content', JSON.stringify(document.content))
        return this.http.put<string[]>(
                `/api/v1/containers/${encodeBase64Url(document.container)}/documents/${encodeBase64Url(document.id)}`,
                formData);
    }
}