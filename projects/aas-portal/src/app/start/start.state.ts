/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { marked } from 'marked';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Type, WritableSignal, signal, Injectable, inject, effect, untracked } from '@angular/core';

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
    private readonly items$ = signal<StartTileItem[]>([]);
    private readonly start = inject(StartService);

    public constructor() {
        effect(() => {
            const tiles = this.start.tiles();
            const map = new Map(untracked(this.items).map(item => [item.tile, item]));
            const items: StartTileItem[] = [];
            for (const tile of tiles) {
                const item = map.get(tile);
                if (item) {
                    items.push(item);
                } else {
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
            }

            this.update({ items });
        });
    }
    /** The favorites. */
    public readonly items = this.items$.asReadonly();

    /** The welcome page. */
    public readonly welcome = toSignal(
        from(this.translate.onLangChange).pipe(
            map(event => event.lang),
            switchMap(lang =>
                this.http.get(`/assets/welcome/${lang}/welcome.md`, { responseType: 'text' }).pipe(
                    catchError(() => {
                        return this.http
                            .get('/assets/welcome/en-us/welcome.md', { responseType: 'text' })
                            .pipe(catchError(() => of(errorWelcome)));
                    }),
                    switchMap(md => {
                        const result = marked.parse(md);
                        return typeof result === 'string' ? of(result) : from(result);
                    }),
                    map(html => this.sanitizer.bypassSecurityTrustHtml(html)),
                ),
            ),
        ),
    );

    /**
     * Updates the state.
     * @param newState The new state.
     */
    public update(newState: Partial<StartData>): void {
        if (newState.items) {
            this.items$.set(newState.items);
        }
    }
}
