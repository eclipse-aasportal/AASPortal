/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotifyService } from '../../lib/notify/notify.service';
import { AuthService } from '../../lib/auth/auth.service';

import { AuthComponent } from '../../lib/auth/auth.component';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';

describe('AuthComponent', () => {
    let component: AuthComponent;
    let fixture: ComponentFixture<AuthComponent>;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['login'], {
            name: signal('guest'),
            authenticated: signal(false),
        });

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error', 'info']),
                },
            ],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        fixture = TestBed.createComponent(AuthComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});