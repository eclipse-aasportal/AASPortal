/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { marked } from 'marked';
import { catchError, map, merge, mergeMap, of, switchMap } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Type, WritableSignal, signal, Injectable, inject, computed } from '@angular/core';

import { StartService, StartTile } from 'aas-lib';

const errorWelcome = `# Sorry
The welcome page is currently not available.
`;

export type StartData = {
    items: StartTileItem[];
};

export interface StartTileItem extends StartTile {
    component: Type<unknown>;
    selected: WritableSignal<boolean>;
    tile: StartTile;
}

@Injectable({
    providedIn: 'root',
})
export class StartState {
    private readonly http = inject(HttpClient);
    private readonly translate = inject(TranslateService);
    private readonly sanitizer = inject(DomSanitizer);
    private readonly start = inject(StartService);

    /** The favorites. */
    public readonly items = computed(() => {
        const tiles = this.start.tiles();
        const items: StartTileItem[] = [];
        for (const tile of tiles) {
            const type = this.start.getType(tile.type);
            if (type === undefined) {
                continue;
            }

            items.push({
                ...tile,
                tile,
                component: type.component,
                selected: signal(false),
            });
        }

        return items;
    });

    /** The welcome page. */
    public readonly welcome = toSignal(
        merge(this.translate.onLangChange.pipe(map(event => event.lang)), of(this.translate.getCurrentLang())).pipe(
            mergeMap(lang =>
                this.http.get(`/assets/welcome/${lang}/welcome.md`, { responseType: 'text' }).pipe(
                    catchError(() => {
                        return this.http
                            .get('/assets/welcome/en-us/welcome.md', { responseType: 'text' })
                            .pipe(catchError(() => of(errorWelcome)));
                    }),
                ),
            ),
            switchMap(md => {
                return marked.parse(md, { async: true });
            }),
            map(html => {
                return this.sanitizer.bypassSecurityTrustHtml(html);
            }),
        ),
    );
}
