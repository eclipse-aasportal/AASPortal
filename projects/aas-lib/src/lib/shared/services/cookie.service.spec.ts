/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { lastValueFrom, of } from 'rxjs';

import { CookieService } from './cookie.service';
import { createSpyObj } from '../../../test/mocks';
import { AuthService } from '../../core/auth/auth.service';
import { WINDOW, WindowService } from './window.service';

describe('CookieService', () => {
    let service: CookieService;
    let http: Mocked<HttpClient>;
    let auth: Mocked<AuthService>;
    let window: Mocked<WindowService>;
    let storage: Mocked<Storage>;

    describe('user', () => {
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

        it('should get cookie', async () => {
            http.get.mockReturnValue(of('Hello World!'));
            const data = await lastValueFrom(service.getCookie('test'));
            expect(data).toBe('Hello World!');
            expect(http.get).toHaveBeenCalled();
        });

        it('should set cookie', async () => {
            http.post.mockReturnValue(of(void 0));
            await lastValueFrom(service.setCookie('test', 'Hello World!'));
            expect(http.post).toHaveBeenCalled();
        });

        it('should delete cookie', async () => {
            http.delete.mockReturnValue(of(void 0));
            await lastValueFrom(service.deleteCookie('test'));
            expect(http.delete).toHaveBeenCalledWith('/api/v1/cookies/test');
        });
    });

    describe('anonym', () => {
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

        it('should get cookie', async () => {
            storage.getItem.mockReturnValueOnce('Hello World!');
            await expect(lastValueFrom(service.getCookie('test'))).resolves.toBe('Hello World!');
            expect(storage.getItem).toHaveBeenCalledWith('test');
        });

        it('should set cookie', async () => {
            await lastValueFrom(service.setCookie('test', 'Hello World!'));
            expect(storage.setItem).toHaveBeenCalledWith('test', 'Hello World!');
        });

        it('should delete cookie', async () => {
            await lastValueFrom(service.deleteCookie('test'));
            expect(storage.removeItem).toHaveBeenCalledWith('test');
        });
    });
});
