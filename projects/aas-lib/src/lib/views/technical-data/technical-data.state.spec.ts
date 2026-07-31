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

import { TechnicalDataState } from './technical-data.state';
import { aas, AASDocument } from 'aas-core';
import { FakeLoader } from '../../../test/mocks';

import technicalData from '../../../test/assets/technical-data-1-2.json';

describe('TechnicalDataState', () => {
    let service: TechnicalDataState;
    let document: AASDocument;

    beforeEach(() => {
        document = {
            address: '',
            idShort: 'TechnicalDataAAS',
            timestamp: 0,
            id: 'https://admin-shell.io/aas/TechnicalData/1/2',
            endpoint: 'Test',
            content: technicalData as aas.Environment,
        };

        TestBed.configureTestingModule({
            providers: [
                TechnicalDataState,
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),

                provideZonelessChangeDetection(),
            ],
        });

        service = TestBed.inject(TechnicalDataState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service.document()).toBeNull();
        expect(service.dataSheets()).toEqual([]);
    });

    it('should update the state', () => {
        service.update({ document });
        expect(service.document()).toBe(document);
        expect(service.dataSheets()).toEqual([]);
    });
});
