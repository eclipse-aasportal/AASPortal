/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { effect, inject, Injectable, InjectionToken, signal, Type } from '@angular/core';
import { catchError, EMPTY, lastValueFrom, map, mergeMap, Observable, of } from 'rxjs';
import { AuthService } from '../components/auth/auth.service';
import { CookieService } from './cookie.service';

export type StartTileType = {
    name: string;
    component: Type<unknown>;
};

export interface StartTile {
    id: string;
    type: string;
    inputs: Record<string, unknown>;
}

/** The provided component types that represent a tile or card on the START page. */
export const START_TILE_TYPES = new InjectionToken<StartTileType[]>('Start tile component types');

/** The initial set of tiles or cards on the START page. */
export const START_TILES = new InjectionToken<StartTile[]>('Start tiles');

const cookieName = 'v1.StartTiles';

@Injectable({
    providedIn: 'root',
})
export class StartService {
    private readonly cookies = inject(CookieService);
    private readonly auth = inject(AuthService);
    private readonly types = inject(START_TILE_TYPES);

    public constructor() {
        const tiles = inject(START_TILES);

        effect(async () => {
            const user = this.auth.user();
            if (user === undefined) {
                return;
            }

            const data = await lastValueFrom(this.cookies.getCookie(cookieName));
            if (data === undefined) {
                this.tiles.set(tiles);
            } else {
                try {
                    this.tiles.set((JSON.parse(data) as StartTile[]).filter(item => this.getType(item.type)));
                } catch {
                    this.tiles.set(tiles);
                }
            }
        });
    }

    public readonly tiles = signal<StartTile[]>(inject(START_TILES));

    public getType(name: string): StartTileType | undefined {
        return this.types.find(item => item.name === name);
    }

    public add(typeName: string, id: string, inputs: Record<string, unknown>): boolean {
        if (this.getType(typeName) === undefined) {
            return false;
        }

        if (this.tiles().some(tile => tile.id === id)) {
            return false;
        }

        this.tiles.update(state => [...state, { id, inputs, type: typeName }]);
        return true;
    }

    public remove(tile: StartTile): void {
        this.tiles.update(state => state.filter(item => item !== tile));
    }

    public save(): Observable<void> {
        return of(this.tiles()).pipe(
            map(tiles => JSON.stringify(tiles)),
            catchError(error => {
                console.error(error);
                return EMPTY;
            }),
            mergeMap(value => this.cookies.setCookie(cookieName, value)),
        );
    }
}
