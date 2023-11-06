/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { encodeBase64Url } from './convert';

@Injectable({
    providedIn: 'root'
})
export class DownloadService {
    constructor(
        private readonly http: HttpClient
    ) {
    }

    /**
     * Download a file from the specified URL.
     * @param url The URL to the file resource.
     * @param filename The file name.
     */
    public async downloadFileAsync(url: string, filename: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.http.get(
                url,
                {
                    responseType: 'blob'
                }).pipe(map(blob => {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.setAttribute('download', filename);
                    a.click();
                    URL.revokeObjectURL(a.href);
                })).subscribe({
                    error: (error) => reject(error),
                    complete: () => resolve()
                });
        });
    }

    /**
     * Downloads an AASX package file.
     * @param url The endpoint URL.
     * @param id The AAS identifier.
     * @param name The file name.
     */
    public downloadDocument(url: string, id: string, name: string): Observable<void> {
        return this.http.get(
            `/api/v1/containers/${encodeBase64Url(url)}/packages/${encodeBase64Url(id)}`,
            {
                responseType: 'blob'
            }).pipe(map(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.setAttribute('download', name);
                a.click();
                URL.revokeObjectURL(a.href);
            }));
    }
    
    /**
     * Uploads the specified aasx file.
     * @param file A file.
     * @param url The URL of the destination.
     */
    public uploadDocuments(url: string, file: File | File[]): Observable<HttpEvent<object>> {
        const data = new FormData();
        if (Array.isArray(file)) {
            file.forEach(item => data.append('file', item));
        } else {
            data.append('file', file);
        }

        return this.http.post(
            `/api/v1/containers/${encodeBase64Url(url)}/packages`,
            data,
            {
                reportProgress: true,
                observe: 'events'
            });
    }
}