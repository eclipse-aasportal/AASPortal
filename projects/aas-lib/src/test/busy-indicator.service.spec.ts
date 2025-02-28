/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';

import { BusyIndicatorService } from '../lib/busy-indicator.service';

describe('BusyIndicatorService', () => {
    let service: BusyIndicatorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(BusyIndicatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});