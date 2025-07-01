/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { marked } from 'marked';
import { catchError, EMPTY, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { NgComponentOutlet } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import {
    ChangeDetectionStrategy,
    Component,
    effect,
    OnDestroy,
    TemplateRef,
    Type,
    viewChild,
    computed,
    WritableSignal,
    signal,
} from '@angular/core';

import { StartService, StartTile, ToolbarService } from 'aas-lib';

export interface StartTileItem extends StartTile {
    component: Type<unknown>;
    selected: WritableSignal<boolean>;
    tile: StartTile;
}

@Component({
    selector: 'fhg-start',
    templateUrl: './start.component.html',
    styleUrl: './start.component.scss',
    imports: [NgComponentOutlet, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartComponent implements OnDestroy {
    private readonly items$ = signal<StartTileItem[]>([]);

    public constructor(
        private readonly http: HttpClient,
        private readonly translate: TranslateService,
        private readonly sanitizer: DomSanitizer,
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
    ) {
        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });

        effect(() => {
            const tiles = this.start.tiles();
            this.items$.update(state => {
                const map = new Map(state.map(item => [item.tile, item]));
                const newState: StartTileItem[] = [];
                for (const tile of tiles) {
                    const item = map.get(tile);
                    if (item !== undefined) {
                        newState.push(item);
                    } else {
                        const type = this.start.getType(tile.type);
                        if (type === undefined) {
                            continue;
                        }

                        newState.push({
                            ...tile,
                            tile,
                            component: type.component,
                            selected: signal(false),
                        });
                    }
                }

                return newState;
            });
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('startToolbar');

    public readonly items = this.items$.asReadonly();

    public readonly isEmpty = computed(() => this.items().length === 0);

    public readonly hasSelected = computed(() => this.items().some(item => item.selected()));

    public readonly canMoveLeft = computed(() => {
        const indexes = this.items()
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.selected())
            .map(({ index }) => index);

        return indexes.length === 1 && indexes[0] > 0;
    });

    public readonly canMoveRight = computed(() => {
        const length = this.items().length;
        const indexes = this.items()
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.selected())
            .map(({ index }) => index);

        return indexes.length === 1 && indexes[0] < length - 1;
    });

    public readonly welcome = toSignal(
        this.http
            .get(`/assets/welcome/${this.translate.currentLang}/welcome.md`, { responseType: 'text' })
            .pipe(
                catchError(() => {
                    return this.http
                        .get('/assets/welcome/en/welcome.md', { responseType: 'text' } )
                        .pipe(catchError(() => of('# Ups...')));
                }),
                switchMap(md => {
                    const result = marked.parse(md);
                    return typeof result === 'string' ? of(result) : from(result);
                }),
                map(html => this.sanitizer.bypassSecurityTrustHtml(html)),
            ),
    );

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public toggleSelected($event: MouseEvent, item: StartTileItem): void {
        item.selected.update(state => !state);
        $event.stopPropagation();
    }

    public remove(): Observable<void> {
        const selectedItems = this.items().filter(item => item.selected());
        if (selectedItems.length === 0) {
            return EMPTY;
        }

        selectedItems.forEach(item => this.start.remove(item.tile));
        return this.start.save();
    }

    public moveLeft(): Observable<void> {
        const index = this.items().findIndex(item => item.selected());
        if (index === -1 || index === 0) {
            return EMPTY;
        }

        this.start.tiles.update(state => {
            const newState = [...state];
            const temp = newState[index];
            newState[index] = newState[index - 1];
            newState[index - 1] = temp;
            return newState;
        });

        return this.start.save();
    }

    public moveRight(): Observable<void> {
        const index = this.items().findIndex(item => item.selected());
        if (index === -1 || index === this.items().length - 1) {
            return EMPTY;
        }

        this.start.tiles.update(state => {
            const newState = [...state];
            const temp = newState[index];
            newState[index] = newState[index + 1];
            newState[index + 1] = temp;
            return newState;
        });

        return this.start.save();
    }
}
