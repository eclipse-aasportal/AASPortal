/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { NotifyService } from 'aas-lib';

import { AASStoreService } from '../../app/aas/aas-store.service';
import { AASApiService } from '../../app/aas/aas-api.service';

describe('AASStoreService', () => {
    let service: AASStoreService;

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

        service = TestBed.inject(AASStoreService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});