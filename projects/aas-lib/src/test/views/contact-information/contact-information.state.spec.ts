/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';

import { ContactInformationState } from '../../../lib/views/contact-information/contact-information.state';

describe.skip('ContactInformationState', () => {
    let service: ContactInformationState;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ContactInformationState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});