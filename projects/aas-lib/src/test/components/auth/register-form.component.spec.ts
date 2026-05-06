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
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { createSpyObj, FakeLoader } from '../../mocks';
import { RegisterFormComponent } from '../../../lib/components/auth/register-form/register-form.component';
import { AuthService } from '../../../lib/components/auth/auth.service';

describe('RegisterFormComponent', () => {
    let fixture: ComponentFixture<RegisterFormComponent>;
    let component: RegisterFormComponent;
    let auth: Mocked<AuthService>;

    beforeEach(async () => {
        auth = createSpyObj<AuthService>([]);

        await TestBed.configureTestingModule({
            imports: [
                RegisterFormComponent,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
            providers: [
                {
                    provide: AuthService,
                    useValue: auth,
                },
                provideZonelessChangeDetection()],
        }).compileComponents();

        fixture = TestBed.createComponent(RegisterFormComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
