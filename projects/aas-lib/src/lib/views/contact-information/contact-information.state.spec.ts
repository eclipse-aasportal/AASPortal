/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { aas, AASDocument } from 'aas-core';
import { ContactInformationState } from './contact-information.state';
import { FakeLoader } from '../../../test/mocks';

import contactInformation from '../../../test/assets/contact-information-1-0.json';

describe('ContactInformationState', () => {
    let service: ContactInformationState;
    let document: AASDocument;

    beforeEach(() => {
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

        TestBed.configureTestingModule({
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
        });

        service = TestBed.inject(ContactInformationState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service.document()).toBeNull();
        expect(service.contacts()).toEqual([]);
    });

    it('should update the state', () => {
        service.update({ document });
        expect(service.document()).toBe(document);
        expect(service.contacts().length).toBe(1);
    });
});
