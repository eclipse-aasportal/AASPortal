/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { FavoriteComponent } from '../../../lib/components/favorite/favorite.component';
import { AuthService } from '../../../lib/components/auth/auth.service';
import { StartService } from '../../../lib/services/start.service';
import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { createSpyObj, FakeLoader } from '../../mocks';

describe('FavoriteComponent', () => {
    let api: Mocked<EndpointsApi>;
    let auth: Mocked<AuthService>;
    let start: Mocked<StartService>;

    beforeEach(async () => {
        auth = createSpyObj<AuthService>(['getCookie', 'setCookie', 'deleteCookie'], { ready: of(true) });
        api = createSpyObj<EndpointsApi>(['getDocument']);
        start = createSpyObj<StartService>(['add', 'save']);

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: EndpointsApi,
                    useValue: api,
                },
                provideZonelessChangeDetection(),
            ],
            imports: [
                FavoriteComponent,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(FavoriteComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
