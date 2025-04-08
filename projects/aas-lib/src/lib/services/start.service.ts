/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Inject, Injectable, InjectionToken, signal, Type } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, map, mergeMap, Observable, of, skipWhile } from 'rxjs';
import { AuthService } from '../auth/auth.service';

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
    public constructor(
        private readonly auth: AuthService,
        @Inject(START_TILE_TYPES) private readonly types: StartTileType[],
        @Inject(START_TILES) tiles: StartTile[],
    ) {
        this.auth.userId
            .pipe(
                skipWhile(userId => userId === undefined),
                takeUntilDestroyed(),
                mergeMap(() => this.auth.getCookie(cookieName)),
            )
            .subscribe(data => {
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

    public readonly tiles = signal<StartTile[]>([]);

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
            mergeMap(value => this.auth.setCookie(cookieName, value)),
        );
    }
}
