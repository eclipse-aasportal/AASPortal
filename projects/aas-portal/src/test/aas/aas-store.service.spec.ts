/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { EndpointsApi, NotifyService } from 'aas-lib';
import { provideZonelessChangeDetection } from '@angular/core';

import { AASStore } from '../../app/aas/aas.store';

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
                    provide: EndpointsApi,
                    useValue: jasmine.createSpyObj<EndpointsApi>(['getContent', 'getDocument', 'putDocument']),
                },
                provideZonelessChangeDetection(),
            ],
        });

        service = TestBed.inject(AASStore);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});