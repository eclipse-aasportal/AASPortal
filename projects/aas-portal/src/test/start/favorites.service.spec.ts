/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from 'aas-lib';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { FavoritesList, FavoritesService } from '../../app/start/favorites.service';
import { AASDocument } from 'projects/aas-core/dist/types';

describe('FavoritesService', () => {
    let service: FavoritesService;
    let auth: jasmine.SpyObj<AuthService>;
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

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['getCookie', 'setCookie', 'deleteCookie'], { userId: of('guest') });
        auth.getCookie.and.returnValue(of(JSON.stringify(favorites)));
        auth.setCookie.and.returnValue(of(void 0));
        auth.deleteCookie.and.returnValue(of(void 0));

        TestBed.configureTestingModule({
            providers: [
                FavoritesService,
                {
                    provide: AuthService,
                    useValue: auth,
                },
            ],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        service = TestBed.inject(FavoritesService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('lists', () => {
        it('provides all favorites lists', () => {
            expect(service.lists()).toEqual(favorites);
        });
    });

    describe('has', () => {
        it('has "My Favorites"', () => {
            expect(service.has('My Favorites')).toBeTrue();
        });

        it('has not "Unknown"', () => {
            expect(service.has('Unknown')).toBeFalse();
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
            expect(service.lists().map(item => item.name)).toEqual(['My Favorites', 'New Favorites']);
        });

        it('renames a favorites list', () => {
            service.add([], 'My Favorites', 'Renamed Favorites');
            expect(service.lists().map(item => item.name)).toEqual(['Renamed Favorites']);
        });
    });

    describe('delete', () => {
        it('deletes "My Favorites"', () => {
            service.delete('My Favorites');
            expect(service.lists().length).toEqual(0);
        });
    });

    describe('remove', () => {
        it('removes a favorite', () => {
            service.remove([favorite], 'My Favorites');
            expect(service.lists().find(item => item.name === 'My Favorites')?.documents).toEqual([]);
        });
    });

    describe('save', () => {
        it('saves the current favorites lists', (done: DoneFn) => {
            service.save().subscribe(() => {
                expect(auth.setCookie).toHaveBeenCalledWith('.Favorites', JSON.stringify(favorites));
                done();
            });
        });
    });
});
