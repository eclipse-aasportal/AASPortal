/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Inject, Injectable, InjectionToken, signal, Type } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, mergeMap, Observable, skipWhile } from 'rxjs';
import { AASDocument } from 'aas-core';
import { StartTileComponent } from './types';
import { AuthService } from './auth/auth.service';

export type StartTileType = {
    name: string;
    component: Type<StartTileComponent>;
};

export type StartTile = {
    endpoint: string;
    id: string;
    type: string;
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
                    this.tiles$.set(value ? (JSON.parse(value) as StartTile[]) : []);
                }),
            )
            .subscribe();
    }

    public readonly tiles = this.tiles$.asReadonly();

    public getType(name: string): StartTileType | undefined {
        return this.types.find(item => item.name === name);
    }

    public add(typeName: string, document: AASDocument): void {
        if (this.getType(typeName) === undefined) {
            return;
        }

        this.tiles$.update(state => [...state, { endpoint: document.endpoint, id: document.id, type: typeName }]);
    }

    public remove(tile: StartTile): void {
        this.tiles$.update(state => state.filter(item => item !== tile));
    }

    public save(): Observable<void> {
        if (this.tiles$().length === 0) {
            return this.auth.deleteCookie('.StartTiles');
        }

        return this.auth.setCookie('.StartTiles', JSON.stringify(this.tiles$()));
    }
}
