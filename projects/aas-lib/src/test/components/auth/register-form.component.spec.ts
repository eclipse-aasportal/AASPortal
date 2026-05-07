/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { createSpyObj, FakeLoader } from '../../mocks';
import { RegisterFormComponent } from '../../../lib/components/auth/register-form/register-form.component';
import { AuthService } from '../../../lib/components/auth/auth.service';
import { NotifyService } from '../../../lib/components/notify/notify.service';
import { WINDOW } from '../../../lib/services/window.service';

describe('RegisterFormComponent', () => {
    let fixture: ComponentFixture<RegisterFormComponent>;
    let component: RegisterFormComponent;
    let auth: Mocked<AuthService>;
    let window: Mocked<Window>;

    beforeEach(async () => {
        auth = createSpyObj<AuthService>([]);
        window = createSpyObj<Window>([], { location: createSpyObj<Location>([], { href: '' }) });

        await TestBed.configureTestingModule({
            imports: [RegisterFormComponent],
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
                    provide: WINDOW,
                    useValue: window,
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

        fixture = TestBed.createComponent(RegisterFormComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
