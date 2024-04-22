/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { first, of } from 'rxjs';
import { AuthService } from 'aas-lib';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { FavoritesService } from '../../app/start/favorites.service';
import { FavoritesList } from '../../app/start/start.state';
import { AASDocument } from 'projects/common/dist/types';

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
        auth = jasmine.createSpyObj<AuthService>(['getCookie', 'setCookie', 'deleteCookie']);
        auth.getCookie.and.returnValue(of(JSON.stringify(favorites)));
        auth.setCookie.and.returnValue(of(void 0));
        auth.deleteCookie.and.returnValue(of(void 0));

        TestBed.configureTestingModule({
            providers: [
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
        it('provides all favorites lists', (done: DoneFn) => {
            service.lists.pipe(first()).subscribe(values => {
                expect(values).toEqual(favorites);
                done();
            });
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
        it('adds a new favorites list', (done: DoneFn) => {
            service.add([], 'New Favorites').subscribe(() => {
                expect(auth.setCookie).toHaveBeenCalledWith(
                    '.Favorites',
                    JSON.stringify([{ ...favorites[0] }, { name: 'New Favorites', documents: [] }] as FavoritesList[]),
                );

                done();
            });
        });

        it('renames a favorites list', (done: DoneFn) => {
            service.add([], 'My Favorites', 'New Favorites').subscribe(() => {
                expect(auth.setCookie).toHaveBeenCalledWith(
                    '.Favorites',
                    JSON.stringify([{ name: 'New Favorites', documents: favorites[0].documents }] as FavoritesList[]),
                );

                done();
            });
        });
    });

    describe('delete', () => {
        it('deletes "My Favorites"', (done: DoneFn) => {
            service.delete('My Favorites').subscribe(() => {
                expect(auth.deleteCookie).toHaveBeenCalledWith('.Favorites');
                done();
            });
        });
    });

    describe('remove', () => {
        it('removes a favorite', (done: DoneFn) => {
            service.remove([favorite], 'My Favorites').subscribe(() => {
                expect(auth.setCookie).toHaveBeenCalledWith(
                    '.Favorites',
                    JSON.stringify([
                        {
                            name: 'My Favorites',
                            documents: [],
                        },
                    ]),
                );

                done();
            });
        });
    });
});
