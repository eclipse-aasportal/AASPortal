/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { lastValueFrom, of } from 'rxjs';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { AuthService, CookieService } from 'aas-lib';
import { AASDocument } from 'aas-core';
import { FavoritesList, FavoritesService, FavoritesState } from '../../app/shells/favorites.service';
import { createSpyObj, FakeLoader } from '../mocks';

describe('FavoritesService', () => {
    let service: FavoritesService;
    let cookies: Mocked<CookieService>;
    let auth: Mocked<AuthService>;
    const favorite: AASDocument = {
        address: 'http://localhost/aas',
        crc32: 0,
        idShort: 'AAS',
        readonly: false,
        timestamp: 0,
        id: 'http://localhost/aas',
        endpoint: 'endpoint',
    };

    const favorites: FavoritesList[] = [
        {
            name: 'My Favorites',
            documents: [favorite],
        },
    ];

    const state: FavoritesState = {
        active: '',
        items: favorites,
    };

    beforeEach(() => {
        cookies = createSpyObj<CookieService>(['getCookie', 'setCookie', 'deleteCookie']);
        cookies.getCookie.mockReturnValue(of(JSON.stringify(state)));
        cookies.setCookie.mockReturnValue(of(void 0));
        cookies.deleteCookie.mockReturnValue(of(void 0));
        auth = createSpyObj<AuthService>([], { ready: of(true) });

        TestBed.configureTestingModule({
            providers: [
                FavoritesService,
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: CookieService,
                    useValue: cookies,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
        });

        service = TestBed.inject(FavoritesService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('items', () => {
        it('provides all favorites lists', () => {
            expect(service.items()).toEqual(favorites);
        });
    });

    describe('active', () => {
        it('provides an active favorite list', () => {
            expect(service.active()).toEqual('');
        });
    });

    describe('has', () => {
        it('has "My Favorites"', () => {
            expect(service.has('My Favorites')).toBe(true);
        });

        it('has not "Unknown"', () => {
            expect(service.has('Unknown')).toBe(false);
        });
    });

    describe('get', () => {
        it('gets the favorites list "My Favorites"', () => {
            expect(service.get('My Favorites')).toEqual(favorites[0]);
        });

        it('gets `undefined` for "Unknown"', () => {
            expect(service.get('Unknown')).toBeUndefined();
        });
    });

    describe('add', () => {
        it('adds a new favorites list', () => {
            service.add([], 'New Favorites');
            expect(service.items().map(item => item.name)).toEqual(['My Favorites', 'New Favorites']);
        });

        it('renames a favorites list', () => {
            service.add([], 'My Favorites', 'Renamed Favorites');
            expect(service.items().map(item => item.name)).toEqual(['Renamed Favorites']);
        });
    });

    describe('delete', () => {
        it('deletes "My Favorites"', () => {
            service.delete('My Favorites');
            expect(service.items().length).toEqual(0);
        });
    });

    describe('remove', () => {
        it('removes a favorite', () => {
            service.remove([favorite], 'My Favorites');
            expect(service.items().find(item => item.name === 'My Favorites')?.documents).toEqual([]);
        });
    });

    describe('save', () => {
        it('saves the current favorites lists', async () => {
            await lastValueFrom(service.save());
            expect(cookies.setCookie).toHaveBeenCalledWith('v2.Favorites', JSON.stringify(state));
        });
    });
});
