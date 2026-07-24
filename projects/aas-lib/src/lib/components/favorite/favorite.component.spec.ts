/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { FavoriteComponent } from './favorite.component';
import { CookieService } from '../../shared/services/cookie.service';
import { EndpointsApi } from '../../shared/services/endpoints-api';
import { createSpyObj, FakeLoader } from '../../../test/mocks';

describe('FavoriteComponent', () => {
    let api: Mocked<EndpointsApi>;
    let cookies: Mocked<CookieService>;

    beforeEach(async () => {
        cookies = createSpyObj<CookieService>(['getCookie', 'setCookie', 'deleteCookie']);
        api = createSpyObj<EndpointsApi>(['getDocument']);

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: CookieService,
                    useValue: cookies,
                },
                {
                    provide: EndpointsApi,
                    useValue: api,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [FavoriteComponent],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(FavoriteComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
