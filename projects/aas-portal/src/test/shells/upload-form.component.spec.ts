/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { UploadFormComponent } from '../../app/shells/upload-form/upload-form.component';
import { createSpyObj, FakeLoader } from '../mocks';

describe('UploadFormComponent', () => {
    let component: UploadFormComponent;
    let fixture: ComponentFixture<UploadFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: NgbActiveModal,
                    useValue: createSpyObj<NgbActiveModal>(['close', 'dismiss']),
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideHttpClient(),
                provideHttpClientTesting(),
                provideZonelessChangeDetection(),
            ],
            imports: [UploadFormComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UploadFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
