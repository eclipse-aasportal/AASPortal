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
import { aas, AASDocument } from 'aas-core';

import { TechnicalDataViewState } from './technical-data-view.state';
import { FakeLoader } from '../../../test/mocks';

import technicalData from '../../../test/assets/technical-data-1-2.json';

describe('TechnicalDataViewState', () => {
    let service: TechnicalDataViewState;
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
                TechnicalDataViewState,
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
        });

        service = TestBed.inject(TechnicalDataViewState);
        service.update({ tuples: [[document, document.content!.submodels![0]]] });
    });

    it('should be created', () => {
        expect(service).toBeInstanceOf(TechnicalDataViewState);
    });
});
