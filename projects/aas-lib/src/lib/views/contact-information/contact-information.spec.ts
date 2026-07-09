/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { aas, AASDocument } from 'aas-core';
import { ContactInformation } from './contact-information';
import { ContactInformationState } from './contact-information.state';
import { FakeLoader } from '../../../test/mocks';

import contactInformation from '../../../test/assets/contact-information-1-0.json';

describe('ContactInformation', () => {
    let component: ContactInformation;
    let fixture: ComponentFixture<ContactInformation>;
    let document: AASDocument;

    beforeEach(async () => {
        document = {
            address: '',
            crc32: 0,
            idShort: 'ContactInformationAAS',
            readonly: false,
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/ContactInformation/1/0',
            endpoint: 'Test',
            content: contactInformation as aas.Environment,
        };

        await TestBed.configureTestingModule({
            providers: [
                ContactInformationState,
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [ContactInformation],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactInformation);
        fixture.componentRef.setInput('state', TestBed.inject(ContactInformationState));
        fixture.componentRef.setInput('document', document);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should has a document', () => {
        expect(component.document()).toBeDefined();
    });
});
