/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import '@angular/localize/init';
import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { aas, AASDocument } from 'aas-core';

import { WindowService } from '../../services/window.service';
import { CarbonFootprint } from './carbon-footprint';
import { createSpyObj, FakeLoader } from '../../../test/mocks';
import { CarbonFootprintState } from './carbon-footprint.state';

import carbon_footprint_1_0 from '../../../test/assets/carbon-footprint-1-0.json';

describe('CarbonFootprint', () => {
    let component: CarbonFootprint;
    let fixture: ComponentFixture<CarbonFootprint>;
    let document: AASDocument;

    beforeEach(async () => {
        window = createSpyObj<WindowService>(['open'], {
            location: { toString: () => 'https://www.fraunhofer.de' } as Location,
        });

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

        await TestBed.configureTestingModule({
            imports: [CarbonFootprint],
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
        }).compileComponents();

        fixture = TestBed.createComponent(CarbonFootprint);
        fixture.componentRef.setInput('state', TestBed.inject(CarbonFootprintState));
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should has document items', () => {
        expect(component.items()).toBeDefined();
    });

    it('should has totalPcfCO2eq', () => {
        expect(component.totalPcfCO2eq()).toEqual('0 undefined');
    });

    it('should has index', () => {
        expect(component.index()).toEqual(1);
    });

    it('should has carbonFootprint', () => {
        expect(component.item()).toBeDefined();
    });

    it('should has collapsed', () => {
        expect(component.collapsed()).toBe(false);
    });

    it('should has count', () => {
        expect(component.count()).toEqual(1);
    });
});
