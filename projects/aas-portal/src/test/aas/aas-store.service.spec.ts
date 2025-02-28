/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { NotifyService } from 'aas-lib';

import { AASStore } from '../../app/aas/aas.store';
import { AASApiService } from '../../app/aas/aas-api.service';

describe('AASStoreService', () => {
    let service: AASStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error']),
                },
                {
                    provide: AASApiService,
                    useValue: jasmine.createSpyObj<AASApiService>(['getContent', 'getDocument', 'putDocument']),
                },
            ],
        });

        service = TestBed.inject(AASStore);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});