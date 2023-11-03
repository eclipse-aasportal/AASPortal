/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';

import { AASProviderService } from '../../lib/aas-provider/aas-provider.service';

describe('AASProviderService', () => {
    let service: AASProviderService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AASProviderService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});