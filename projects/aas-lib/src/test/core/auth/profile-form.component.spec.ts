/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { Router } from '@angular/router';

import { ProfileFormComponent } from '../../../lib/core/auth/profile-form/profile-form.component';
import { createSpyObj, FakeLoader } from '../../mocks';
import { AuthService } from '../../../lib/core/auth/auth.service';
import { NotifyService } from '../../../lib/core/notify/notify.service';

describe('ProfileFormComponent', () => {
    let fixture: ComponentFixture<ProfileFormComponent>;
    let component: ProfileFormComponent;
    let auth: Mocked<AuthService>;
    let router: Mocked<Router>;
    let notify: Mocked<NotifyService>;

    beforeEach(async () => {
        auth = createSpyObj<AuthService>([], { user: signal(null) });
        router = createSpyObj<Router>(['navigateByUrl']);
        notify = createSpyObj<NotifyService>(['error']);

        await TestBed.configureTestingModule({
            imports: [ProfileFormComponent],
            providers: [
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: Router,
                    useValue: router,
                },
                {
                    provide: NotifyService,
                    useValue: notify,
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

        fixture = TestBed.createComponent(ProfileFormComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
