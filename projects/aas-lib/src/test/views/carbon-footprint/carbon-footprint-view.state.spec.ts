/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { aas, AASDocument } from 'aas-core';
import { CarbonFootprintViewState } from '../../../lib/views/carbon-footprint/carbon-footprint-view.state';
import { CarbonFootprintState } from '../../../lib/views/carbon-footprint/carbon-footprint.state';
import { FakeLoader } from '../../mocks';

import carbon_footprint_1_0 from '../../assets/carbon-footprint-1-0.json';

describe('CarbonFootprintViewState', () => {
    let service: CarbonFootprintViewState;
    let document: AASDocument;
    let submodel: aas.Submodel;

    beforeEach(() => {
        document = {
            address: '',
            crc32: 0,
            idShort: 'CarbonFootprint',
            readonly: false,
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/CarbonFootprintAAS/1/0',
            endpoint: 'Test',
            content: carbon_footprint_1_0 as aas.Environment,
        };

        submodel = document.content!.submodels[0];

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
        service.update({ tuples: [[document, submodel]] });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should provide a state for the CarbonFootprint component', () => {
        expect(service.carbonFootprintState).toBeInstanceOf(CarbonFootprintState);
    });

    it('should provide tuples', () => {
        expect(service.tuples()).toEqual([[document, submodel]]);
    });
});
