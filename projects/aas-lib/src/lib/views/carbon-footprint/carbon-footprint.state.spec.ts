/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { aas, AASDocument } from 'aas-core';

import { CarbonFootprintState } from './carbon-footprint.state';
import { FakeLoader } from '../../../test/mocks';

import carbon_footprint_1_0 from '../../../test/assets/carbon-footprint-1-0.json';

describe('CarbonFootprintState', () => {
    let service: CarbonFootprintState;
    let document: AASDocument;

    beforeEach(() => {
        document = {
            address: '',
            idShort: 'CarbonFootprint',
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/CarbonFootprintAAS/1/0',
            endpoint: 'Test',
            content: carbon_footprint_1_0 as aas.Environment,
        };

        TestBed.configureTestingModule({
            providers: [
                CarbonFootprintState,
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
        });

        service = TestBed.inject(CarbonFootprintState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service.document()).toBeNull();
        expect(service.submodel()).toBeNull();
        expect(service.items()).toEqual([
            {
                collapsed: false,
                items: [],
            },
        ]);

        expect(service.index()).toBe(1);
        expect(service.totalPcfCO2eq()).toEqual('');
    });

    it('should update the state', () => {
        service.update({ document });
        expect(service.document()).toBe(document);
        expect(service.submodel()).toBeDefined();
    });
});
