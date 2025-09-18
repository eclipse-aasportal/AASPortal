/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';

import { DigitalProductPassportViewState } from '../../../lib/views/digital-product-passport/digital-product-passport-view.state';

describe.skip('DigitalProductPassportViewState', () => {
    let service: DigitalProductPassportViewState;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DigitalProductPassportViewState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});