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
import { FavoritesService } from '../../app/start/favorites.service';

describe('FavoritesService', () => {
    let service: FavoritesService;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['getCookie', 'setCookie']);
        auth.getCookie.and.returnValue(of(undefined));
        auth.setCookie.and.returnValue(of(void 0));

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
});
