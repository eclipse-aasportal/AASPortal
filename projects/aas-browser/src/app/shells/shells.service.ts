/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpEvent, httpResource } from '@angular/common/http';
import { catchError, filter, map, mergeMap, Observable, of, tap } from 'rxjs';
import { aas, PackageDescription, PagedResult } from 'aas-core';
import { API_URL, decodeBase64Url, encodeBase64Url, NotifyService } from 'aas-lib';

import { Cursor } from '../types';

export interface ShellsDataItem {
    id: string;
    idShort: string;
    thumbnail: string | undefined;
    selected: boolean;
}

export interface ShellsData {
    items: ShellsDataItem[];
    current: Cursor;
}

export interface ShellsPage {
    cursor: Cursor | undefined;
    items: ShellsDataItem[];
}

const initialState: ShellsData = {
    items: [],
    current: { next: undefined, previous: undefined },
};

/**
 * Provides the state of the ShellsComponent.
 */
@Injectable({ providedIn: 'root' })
export class ShellsService {
    private readonly apiUrl = inject(API_URL);
    private readonly http = inject(HttpClient);
    private readonly notify = inject(NotifyService);
    private readonly items$ = signal(initialState.items);
    private readonly current$ = signal<Cursor | undefined>(initialState.current);

    public constructor() {
        effect(() => {
            const page = this.page.value();
            this.update({ items: page.items, current: page.cursor });
        });
    }

    /**
     * The maximum number of items per page.
     */
    public readonly limit = signal(30);

    /**
     * The request for loading a page.
     */
    public readonly cursor = signal<Cursor | undefined>(undefined);

    /**
     * The items of the current page.
     */
    public readonly items = this.items$.asReadonly();

    /**
     * The cursor of the current page.
     */
    public readonly current = this.current$.asReadonly();

    /**
     * Uploads a package file.
     *
     * @param file - The File object to upload. Callers should ensure the file is valid and within
     *   any size/type constraints expected by the server.
     * @returns An Observable that emits Angular HttpEvent<object> instances (e.g., UploadProgress,
     *   Response) allowing the caller to monitor progress and handle the server response.
     */
    public uploadPackage(file: File): Observable<HttpEvent<object>> {
        const data = new FormData();
        data.append('file', file);
        return this.http.post(this.apiUrl.join(`packages`), data, {
            reportProgress: true,
            observe: 'events',
        });
    }

    /**
     * Downloads the package (.aasx) associated with a given AAS identifier.
     *
     * @param id - The identifier of the AAS whose package should be downloaded.
     * @returns An Observable that completes when the download flow has finished
     * (or when aborted due to lookup errors / missing package).
     */
    public downloadPackage(id: string): Observable<void> {
        return this.http
            .get<PagedResult<PackageDescription>>(this.apiUrl.join(`packages?aasId=${encodeBase64Url(id)}`))
            .pipe(
                catchError(error => {
                    this.notify.error(error);
                    return of();
                }),
                map(result => result.result.at(0)?.packageId),
                tap(packageId => {
                    if (!packageId) {
                        this.notify.error('Shell.AAS_NOT_CONTAINED', { id });
                    }
                }),
                filter(packageId => packageId != null),
                mergeMap(packageId => {
                    return this.http.get(this.apiUrl.join(`packages/${encodeBase64Url(packageId)}`), {
                        responseType: 'blob',
                    });
                }),
                map(blob => {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.setAttribute('download', `${id}.aasx`);
                    a.click();
                    URL.revokeObjectURL(a.href);
                }),
                tap(() => {
                    this.notify.info('Shells.SUCCESSFULLY_DOWNLOADED', { id });
                }),
            );
    }

    /**
     * Deletes the package associated with the given AAS (Asset Administration Shell) identifier, if one exists.
     *
     * @param id - The identifier of the AAS whose package should be deleted.
     * @returns An Observable<void> that completes when the operation finishes.
     * The observable completes without deleting if no package is associated with the given AAS or if the initial GET fails; if the DELETE request fails the error is forwarded to subscribers.
     */
    public deletePackage(id: string): Observable<void> {
        return this.http
            .get<PagedResult<PackageDescription>>(this.apiUrl.join(`packages?aasId=${encodeBase64Url(id)}`))
            .pipe(
                catchError(error => {
                    this.notify.error(error);
                    return of();
                }),
                map(result => result.result.at(0)?.packageId),
                tap(packageId => {
                    if (!packageId) {
                        this.notify.error('Shell.AAS_NOT_CONTAINED', { id });
                    }
                }),
                filter(packageId => packageId != null),
                mergeMap(packageId => {
                    return this.http.delete<void>(this.apiUrl.join(`packages/${encodeBase64Url(packageId)}`));
                }),
                tap(() => {
                    this.update({ items: this.items().filter(item => item.id !== id) });
                    this.notify.info('Shells.SUCCESSFULLY_DELETED', { id });
                }),
            );
    }

    /**
     * Apply partial updates to the ShellsData state.
     *
     * @param newState - A partial ShellsData object containing one or more fields to update.
     */
    public update(newState: Partial<ShellsData>): void {
        if (newState.items) {
            this.items$.set(newState.items);
        }

        if (newState.current !== undefined) {
            this.current$.set(newState.current);
        }
    }

    private readonly parse = (data: unknown): ShellsPage => {
        const result = data as PagedResult<aas.AssetAdministrationShell>;
        const items: ShellsDataItem[] = [];
        if (result.result) {
            for (const shell of result.result) {
                items.push({
                    id: shell.id,
                    idShort: shell.idShort,
                    selected: false,
                    thumbnail: this.apiUrl
                        .join(`shells/${encodeBase64Url(shell.id)}/asset-information/thumbnail`)
                        .toString(),
                });
            }
        }

        let cursor: Cursor | undefined;
        if (result.paging_metadata.cursor) {
            cursor = JSON.parse(decodeBase64Url(result.paging_metadata.cursor));
        }

        return { items, cursor: cursor ?? { next: undefined, previous: undefined } };
    };

    private readonly page = httpResource(
        () => {
            const cursor = this.cursor();
            const limit = this.limit();
            const params: Record<string, string> = { limit: limit.toString() };
            if (cursor) {
                params['cursor'] = encodeBase64Url(JSON.stringify(cursor));
            }

            return this.apiUrl.join('shells', params);
        },
        {
            defaultValue: { cursor: undefined, items: [] },
            parse: this.parse,
        },
    );
}
