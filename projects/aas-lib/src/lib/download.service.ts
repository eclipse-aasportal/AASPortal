/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClient, HttpEvent } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { encodeBase64Url } from './convert';

@Injectable({
    providedIn: 'root',
})
export class DownloadService {
    public constructor(
        private readonly http: HttpClient,
        @Inject(DOCUMENT) private readonly document: Document,
    ) {}

    /**
     * Downloads a file from the specified URL.
     * @param url The URL to the file resource.
     * @param filename The file name.
     */
    public download(url: string, filename: string): Observable<void> {
        return this.http
            .get(url, {
                responseType: 'blob',
            })
            .pipe(
                map(blob => {
                    const a = this.document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.setAttribute('download', filename);
                    a.click();
                    URL.revokeObjectURL(a.href);
                }),
            );
    }

    /**
     * Downloads an AASX package file.
     * @param endpoint The endpoint name.
     * @param id The AAS identifier.
     * @param name The file name.
     */
    public downloadPackage(endpoint: string, id: string, name: string): Observable<void> {
        return this.http
            .get(`/api/v1/endpoints/${encodeBase64Url(endpoint)}/packages/${encodeBase64Url(id)}`, {
                responseType: 'blob',
            })
            .pipe(
                map(blob => {
                    const a = this.document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.setAttribute('download', name);
                    a.click();
                    URL.revokeObjectURL(a.href);
                }),
            );
    }

    /**
     * Uploads the specified aasx file.
     * @param file A file.
     * @param endpoint The name of the destination endpoint.
     */
    public uploadPackages(endpoint: string, file: File | File[]): Observable<HttpEvent<object>> {
        const data = new FormData();
        if (Array.isArray(file)) {
            file.forEach(item => data.append('files', item));
        } else {
            data.append('files', file);
        }

        return this.http.post(`/api/v1/endpoints/${encodeBase64Url(endpoint)}/packages`, data, {
            reportProgress: true,
            observe: 'events',
        });
    }
}
