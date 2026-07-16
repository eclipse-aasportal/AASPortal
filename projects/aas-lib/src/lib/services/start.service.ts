/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, Injectable, InjectionToken, linkedSignal, Type } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { CookieService } from '../share/services/cookie.service';
import { rxResource } from '@angular/core/rxjs-interop';

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
    private readonly startTiles = inject(START_TILES);

    private tilesResource = rxResource({
        params: () => this.auth.user(),
        stream: () =>
            this.cookies.getCookie(cookieName).pipe(
                map(data =>
                    data ? (JSON.parse(data) as StartTile[]).filter(item => this.getType(item.type)) : this.startTiles,
                ),
                catchError(() => of(this.startTiles)),
            ),
        defaultValue: this.startTiles,
    });

    public readonly tiles = linkedSignal(() => this.tilesResource.value());

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
        try {
            return this.cookies.setCookie(cookieName, JSON.stringify(this.tiles()));
        } catch (error) {
            console.error('Failed to save start tiles', error);
            return of(void 0);
        }
    }
}
