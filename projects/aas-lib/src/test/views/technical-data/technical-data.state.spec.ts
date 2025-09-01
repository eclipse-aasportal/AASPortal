/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { aas, AASDocument } from 'aas-core';
import { TechnicalDataState } from '../../../lib/views/technical-data/technical-data.state';
import { FakeLoader } from '../../mocks';

import technicalData from '../../assets/technical-data-1-2.json';

describe('TechnicalDataState', () => {
    let service: TechnicalDataState;
    let document: AASDocument;

    beforeEach(() => {
        document = {
            address: '',
            crc32: 0,
            idShort: 'TechnicalDataAAS',
            readonly: false,
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
        service.update({ document });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should update document', () => {
        expect(service.document()).toEqual(document);
    });

    it('should provide data sheets', () => {
        const dataSheets = service.dataSheets();
        expect(dataSheets).toBeDefined();
    });
});
