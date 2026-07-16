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
import { of } from 'rxjs';
import { DashboardService } from './dashboard.service';

import data from '../../../test/assets/test-pages.json';
import { CookieService } from '../../share/services/cookie.service';
import { AuthService } from '../../core/auth/auth.service';
import { createSpyObj, FakeLoader } from '../../../test/mocks';

describe('DashboardService', () => {
    let service: DashboardService;
    let cookies: Mocked<CookieService>;
    let auth: Mocked<AuthService>;

    beforeEach(() => {
        cookies = createSpyObj<CookieService>(['getCookie']);
        cookies.getCookie.mockReturnValue(of(JSON.stringify(data)));
        auth = createSpyObj<AuthService>([], { ready: of(true) });

        TestBed.configureTestingModule({
            imports: [],
            providers: [
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

        service = TestBed.inject(DashboardService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('returns the pages', () => {
        expect(service.pages().length).toBe(2);
    });

    it('returns the active page', () => {
        expect(service.activePage().name).toEqual('Test');
    });

    it('indicates that editMode is false', () => {
        expect(service.editMode()).toBe(false);
    });

    it('gets a memento', () => {
        expect(service.getMemento()).toEqual(JSON.stringify(data));
    });

    it('sets a memento', () => {
        const data = [
            {
                name: 'Dashboard 1',
                items: [],
                requests: [],
                active: true,
            },
        ];

        service.setMemento(JSON.stringify(data));
        expect(service.toString(service.pages())).toEqual(JSON.stringify(data));
    });
});
