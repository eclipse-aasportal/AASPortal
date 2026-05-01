/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { UpdateEndpointFormComponent } from '../../app/shells/update-endpoint-form/update-endpoint-form.component';
import { FakeLoader } from '../mocks';

describe('UpdateEndpointFormComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                NgbActiveModal,
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [UpdateEndpointFormComponent],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(UpdateEndpointFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});