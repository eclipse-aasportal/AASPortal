/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { inputBinding, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { FieldState } from '@angular/forms/signals';

import { createSpyObj, FakeLoader } from '../../../../test/mocks';
import { FormError } from './form-error';

describe('FormError', () => {
    let component: FormError;
    let fixture: ComponentFixture<FormError>;
    let fieldState: Mocked<FieldState<unknown>>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [FormError],
        }).compileComponents();

        fieldState = createSpyObj<FieldState<unknown>>([], {
            valid: signal(true).asReadonly(),
            errors: signal([]).asReadonly(),
            touched: signal(false).asReadonly(),
            dirty: signal(false).asReadonly(),
        });

        fixture = TestBed.createComponent(FormError, {
            bindings: [inputBinding('field', () => fieldState)],
        });

        component = fixture.componentInstance;
        await fixture.whenStable();

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
