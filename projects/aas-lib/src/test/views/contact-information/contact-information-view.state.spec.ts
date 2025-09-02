/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';

import { ContactInformationViewState } from '../../../lib/views/contact-information/contact-information-view.state';

describe.skip('ContactInformationViewState', () => {
    let service: ContactInformationViewState;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ContactInformationViewState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});