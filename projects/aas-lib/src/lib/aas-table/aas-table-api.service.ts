/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AASCursor, AASPage, aas } from 'common';
import { encodeBase64Url } from '../convert';

@Injectable({
    providedIn: 'root'
})
export class AASTableApiService {
    constructor(private readonly http: HttpClient) {
    }

    /**
     * Returns a page of documents from the specified cursor.
     * @param cursor The current cursor.
     * @param filter A filter expression.
     * @param language The language to used for the filter.
     * @returns The document page.
     */
    public getDocuments(cursor: AASCursor, filter?: string, language?: string): Observable<AASPage> {
        let url = `/api/v1/documents?cursor=${encodeBase64Url(JSON.stringify(cursor))}`;
        if (filter) {
            url += `&filter=${encodeBase64Url(filter)}`;
            if (language) {
                url += `&language=${language}`;
            }
        }
        return this.http.get<AASPage>(url);
    }

    /**
     * Loads the element structure of the specified document.
     * @param url The URL of the container.
     * @param id The identification of the AAS document.
     * @returns The root of the element structure.
     */
    public getContent(url: string, id: string): Observable<aas.Environment> {
        return this.http.get<aas.Environment>(
            `/api/v1/containers/${encodeBase64Url(url)}/documents/${encodeBase64Url(id)}/content`);
    }
}