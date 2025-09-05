/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';

import { TechnicalDataState } from '../../../lib/views/technical-data/technical-data.state';

describe.skip('TechnicalDataState', () => {
    let service: TechnicalDataState;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TechnicalDataState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});