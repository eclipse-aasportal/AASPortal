import { inject, Injectable, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { aas, PagedResult } from 'aas-core';
import { API_URL, decodeBase64Url, encodeBase64Url } from 'aas-lib';

import { Cursor } from '../types';

export interface ShellsDataItem {
    id: string;
    idShort: string;
    thumbnail: string | undefined;
}

export interface ShellsData {
    items: ShellsDataItem[];
}

export interface HttpValue {
    cursor: Cursor | undefined;
    items: ShellsDataItem[];
}

/** Provides the state of the ShellsComponent. */
@Injectable({ providedIn: 'root' })
export class ShellsService {
    private readonly apiUrl = inject(API_URL);

    private readonly parse = (data: unknown): HttpValue => {
        const result = data as PagedResult<aas.AssetAdministrationShell>;
        const items: ShellsDataItem[] = [];
        if (result.result) {
            for (const shell of result.result) {
                items.push({
                    id: shell.id,
                    idShort: shell.idShort,
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

        return { items, cursor };
    };

    /** The maximum number of items per page.  */
    public readonly limit = signal(30);

    /** The request for loading a page. */
    public readonly cursor = signal<Cursor | undefined>(undefined);

    /** */
    public get current(): Cursor | undefined {
        return this.value.value().cursor;
    }

    /** */
    public readonly value = httpResource(
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
