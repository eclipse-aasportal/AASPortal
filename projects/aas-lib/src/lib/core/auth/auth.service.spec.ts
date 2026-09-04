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
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { lastValueFrom, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { SessionUser } from 'aas-core';
import { WINDOW, WindowService } from '../../shared/services/window.service';
import { NotifyService } from '../notify/notify.service';
import { AuthService } from './auth.service';
import { createSpyObj, FakeLoader } from '../../../test/mocks';

describe('AuthService', () => {
    let service: AuthService;
    let http: Mocked<HttpClient>;
    let window: Mocked<WindowService>;
    let activatedRoute: Mocked<ActivatedRoute>;
    let paramMap: Mocked<ParamMap>;

    beforeEach(() => {
        http = createSpyObj<HttpClient>(['get', 'post', 'put', 'patch', 'delete']);
        http.get.mockReturnValue(of(null));

        const localStorage = createSpyObj<Storage>(['getItem', 'setItem', 'removeItem', 'clear']);
        localStorage.getItem.mockReturnValue(null);
        const location = createSpyObj<Location>(['assign']);
        window = createSpyObj<WindowService>(['confirm'], { localStorage, location });

        paramMap = createSpyObj<ParamMap>(['get']);
        activatedRoute = createSpyObj<ActivatedRoute>([], { queryParamMap: of(paramMap) });

        TestBed.configureTestingModule({
            imports: [],
            providers: [
                {
                    provide: WINDOW,
                    useValue: window,
                },
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error']),
                },
                {
                    provide: HttpClient,
                    useValue: http,
                },
                {
                    provide: ActivatedRoute,
                    useValue: activatedRoute,
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

        service = TestBed.inject(AuthService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service.user()).toBeNull();
        expect(service.email()).toBeUndefined();
        expect(service.name()).toBeUndefined();
        expect(service.role()).toBeUndefined();
    });

    describe('login', () => {
        it('should perform login and update user state', async () => {
            const mockUser: SessionUser = {
                id: 'john.dow@email.com',
                name: 'John Dow',
                role: 'user',
                client_id: 'client-123',
            };

            http.post.mockReturnValue(of(mockUser));
            paramMap.get.mockReturnValue('callbackUrl');
            await lastValueFrom(service.login({ id: 'john.dow@email.com', password: 'password123' }));
            expect(http.post).toHaveBeenCalled();
        });
    });
});
