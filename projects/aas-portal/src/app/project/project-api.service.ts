/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { HttpClient, } from '@angular/common/http';
import { AASDocument, AASWorkspace, aas } from 'common';
import { Observable } from 'rxjs';
import { encodeBase64Url } from 'aas-lib';

/** The client side AAS provider service. */
@Injectable({
    providedIn: 'root'
})
export class ProjectAPIService {
    constructor(
        private readonly http: HttpClient,
    ) {}

    /**
    * Returns the basic data of all available AAS containers.
    * @returns An array of `AASContainer`.
    */
    public getWorkspaces(): Observable<AASWorkspace[]> {
        return this.http.get<AASWorkspace[]>('/api/v1/workspaces');
    }

    /**
     * Returns all documents contained in the container with the specified URL.
     * @param url The container URL.
     * @returns The documents of the specified container.
     */
    public getDocuments(url: string): Observable<AASDocument[]> {
        return this.http.get<AASDocument[]>(`/api/v1/containers/${encodeBase64Url(url)}/documents`);
    }

    /**
     * Gets the referenced AAS document.
     * @param id The identification or name of the document.
     * @param url The URL of the container.
     * @returns The AAS document.
     */
    public getDocument(id: string, url?: string): Observable<AASDocument> {
        return this.http.get<AASDocument>(
            url ? `/api/v1/containers/${encodeBase64Url(url)}/documents/${encodeBase64Url(id)}`
                : `/api/v1/documents/${encodeBase64Url(id)}`);
    }

    /**
     * Loads the element structure of the specified document.
     * @param id The identification of the AAS document.
     * @param url The URL of the container.
     * @returns The root of the element structure.
     */
    public getContent(id: string, url: string): Observable<aas.Environment> {
        return this.http.get<aas.Environment>(
            `/api/v1/containers/${encodeBase64Url(url)}/documents/${encodeBase64Url(id)}/content`);
    }

    /**
     * Adds a new endpoint to the AASServer configuration.
     * @param endpoint The registry.
     */
    public addEndpoint(name: string, url: string): Observable<void> {
        return this.http.post<void>(`/api/v1/endpoints/${name}`, { url });
    }

    /**
     * Removes the specified endpoint from the AASServer configuration.
     * @param name The name of the endpoint.
     */
    public removeEndpoint(name: string): Observable<void> {
        return this.http.delete<void>(`/api/v1/endpoints/${name}`);
    }

    /**
     * Restores the default workspace/container configuration.
     */
    public reset(): Observable<void> {
        return this.http.delete<void>('/api/v1/containers/reset');
    }

    /**
     * Delete the specified AAS document from the corresponding AAS container.
     * @param id The identification of the AAS document to delete.
     * @param url The URL of the AAS container.
     * @returns An observable.
     */
    public deleteDocument(id: string, url: string): Observable<void> {
        return this.http.delete<void>(
            `/api/v1/containers/${encodeBase64Url(url)}/documents/${encodeBase64Url(id)}`);
    }
}