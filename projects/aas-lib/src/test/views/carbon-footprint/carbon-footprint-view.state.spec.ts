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

import { CarbonFootprintViewState } from '../../../lib/views/carbon-footprint/carbon-footprint-view.state';
import { FakeLoader } from '../../mocks';

describe('CarbonFootprintViewState', () => {
    let service: CarbonFootprintViewState;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),

                provideZonelessChangeDetection(),
            ],
        });
        service = TestBed.inject(CarbonFootprintViewState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service.carbonFootprintState).toBeDefined();
    });
});
