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
import { ContactInformationViewState } from './contact-information-view.state';
import { ContactInformationState } from './contact-information.state';
import { FakeLoader } from '../../../test/mocks';

import contactInformation from '../../../test/assets/contact-information-1-0.json';

describe('ContactInformationViewState', () => {
    let service: ContactInformationViewState;
    let document: AASDocument;
    let submodel: aas.Submodel;

    beforeEach(() => {
        document = {
            address: '',
            idShort: 'ContactInformationAAS',
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/ContactInformation/1/0',
            endpoint: 'Test',
            content: contactInformation as aas.Environment,
        };

        submodel = document.content!.submodels![0];

        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
        });
        service = TestBed.inject(ContactInformationViewState);
        service.update({ tuples: [[document, submodel]] });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should provide a state for the CarbonFootprint component', () => {
        expect(service.contactInformationState).toBeInstanceOf(ContactInformationState);
    });

    it('should provide tuples', () => {
        expect(service.tuples()).toEqual([[document, submodel]]);
    });
});
