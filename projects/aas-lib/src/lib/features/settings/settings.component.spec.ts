/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsComponent } from './settings.component';
import { provideZonelessChangeDetection } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { createSpyObj, FakeLoader } from '../../../test/mocks';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { EndpointsApi } from '../../shared/services/endpoints-api';
import { NotifyService } from '../../core/notify/notify.service';

describe('SettingsComponent', () => {
    let component: SettingsComponent;
    let fixture: ComponentFixture<SettingsComponent>;
    let modal: Mocked<NgbModal>;
    let auth: Mocked<AuthService>;
    let api: Mocked<EndpointsApi>;
    let notify: Mocked<NotifyService>;

    beforeEach(async () => {
        modal = createSpyObj<NgbModal>(['open']);
        auth = createSpyObj<AuthService>(['ensureAuthorized']);
        api = createSpyObj<EndpointsApi>(['addEndpoint']);
        notify = createSpyObj<NotifyService>(['info', 'error']);

        await TestBed.configureTestingModule({
            providers: [
                { provide: NgbModal, useValue: modal },
                { provide: AuthService, useValue: auth },
                { provide: EndpointsApi, useValue: api },
                { provide: NotifyService, useValue: notify },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [SettingsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SettingsComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
