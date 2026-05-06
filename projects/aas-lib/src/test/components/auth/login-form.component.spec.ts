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
import { Router } from '@angular/router';

import { LoginFormComponent } from '../../../lib/components/auth/login-form/login-form.component';
import { createSpyObj, FakeLoader } from '../../mocks';
import { AuthService } from '../../../lib/components/auth/auth.service';
import { NotifyService } from '../../../lib/components/notify/notify.service';

describe('LoginFormComponent', () => {
    let auth: Mocked<AuthService>;
    let router: Mocked<Router>;

    beforeEach(async () => {
        auth = createSpyObj<AuthService>(['login'], {});
        router = createSpyObj<Router>(['navigateByUrl']);

        await TestBed.configureTestingModule({
            imports: [
                LoginFormComponent,
            ],
            providers: [
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error']),
                },
                {
                    provide: Router,
                    useValue: router,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(LoginFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
