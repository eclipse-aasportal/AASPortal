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
import { AuthService } from './auth/auth.service';

export type StartTileType = {
    name: string;
    component: Type<unknown>;
};

export type StartTile = {
    id: string;
    type: string;
    property: Record<string, unknown>;
};

export const START_TILE_TYPES = new InjectionToken<StartTileType[]>('Start tile component types');

@Injectable({
    providedIn: 'root',
})
export class StartService {
    private readonly tiles$ = signal<StartTile[]>([]);

    public constructor(
        private readonly auth: AuthService,
        @Inject(START_TILE_TYPES) private readonly types: StartTileType[],
    ) {
        this.auth.userId
            .pipe(
                skipWhile(userId => userId === undefined),
                takeUntilDestroyed(),
                mergeMap(() => this.auth.getCookie('.StartTiles')),
                map(value => {
                    let values: StartTile[];
                    try {
                        values = value ? (JSON.parse(value) as StartTile[]) : [];
                    } catch {
                        values = [];
                    }

                    this.tiles$.set(values);
                }),
            )
            .subscribe();
    }

    public readonly tiles = this.tiles$.asReadonly();

    public getType(name: string): StartTileType | undefined {
        return this.types.find(item => item.name === name);
    }

    public add(typeName: string, id: string, property: Record<string, unknown>): boolean {
        if (this.getType(typeName) === undefined) {
            return false;
        }

        if (this.tiles$().some(tile => tile.id === id)) {
            return false;
        }

        this.tiles$.update(state => [...state, { id, property, type: typeName }]);
        return true;
    }

    public remove(tile: StartTile): void {
        this.tiles$.update(state => state.filter(item => item !== tile));
    }

    public save(): Observable<void> {
        return of(this.tiles$()).pipe(
            map(tiles => JSON.stringify(tiles)),
            catchError(error => {
                console.error(error);
                return EMPTY;
            }),
            mergeMap(value => this.auth.setCookie('.StartTiles', value)),
        );
    }
}
