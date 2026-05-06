/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

import { CookieService } from '../../lib/services/cookie.service';
import { createSpyObj } from '../mocks';
import { AuthService } from '../../lib/components/auth/auth.service';
import { WINDOW, WindowService } from '../../lib/services/window.service';

describe('CookieService', () => {
    let service: CookieService;
    let http: Mocked<HttpClient>;
    let auth: Mocked<AuthService>;
    let window: Mocked<WindowService>;
    let storage: Mocked<Storage>;

    describe('authenticated user', () => {
        beforeEach(() => {
            http = createSpyObj<HttpClient>(['get', 'delete', 'post']);
            auth = createSpyObj<AuthService>([], { isAuthenticated: signal(true) });
            storage = createSpyObj<Storage>(['getItem', 'setItem', 'removeItem']);
            window = createSpyObj<WindowService>([], { localStorage: storage });

            TestBed.configureTestingModule({
                providers: [
                    {
                        provide: HttpClient,
                        useValue: http,
                    },
                    {
                        provide: AuthService,
                        useValue: auth,
                    },
                    {
                        provide: WINDOW,
                        useValue: window,
                    },
                ],
            });

            service = TestBed.inject(CookieService);
        });

        it('should create', () => {
            expect(service).toBeInstanceOf(CookieService);
        });
    });

    describe('guest user', () => {
        beforeEach(() => {
            http = createSpyObj<HttpClient>(['get', 'delete', 'post']);
            auth = createSpyObj<AuthService>([], { isAuthenticated: signal(false) });
            storage = createSpyObj<Storage>(['getItem', 'setItem', 'removeItem']);
            window = createSpyObj<WindowService>([], { localStorage: storage });

            TestBed.configureTestingModule({
                providers: [
                    {
                        provide: HttpClient,
                        useValue: http,
                    },
                    {
                        provide: AuthService,
                        useValue: auth,
                    },
                    {
                        provide: WINDOW,
                        useValue: window,
                    },
                ],
            });

            service = TestBed.inject(CookieService);
        });

        it('should create', () => {
            expect(service).toBeInstanceOf(CookieService);
        });
    });
});
