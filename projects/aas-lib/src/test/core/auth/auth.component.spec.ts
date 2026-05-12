/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideZonelessChangeDetection, signal } from '@angular/core';

import { NotifyService } from '../../../lib/core/notify/notify.service';
import { AuthService } from '../../../lib/core/auth/auth.service';
import { AuthComponent } from '../../../lib/core/auth/auth.component';
import { createSpyObj, FakeLoader } from '../../mocks';

describe('AuthComponent', () => {
    let auth: Mocked<AuthService>;

    beforeEach(async () => {
        auth = createSpyObj<AuthService>(['login'], {
            name: signal<string | undefined>(undefined),
            isAuthenticated: signal(false),
        });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error', 'info']),
                },
                provideZonelessChangeDetection(),
            ],
            imports: [
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
        const fixture = TestBed.createComponent(AuthComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
