/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { aas, AASDocument } from 'aas-core';
import { TechnicalData } from './technical-data';
import { FakeLoader } from '../../../test/mocks';
import { TechnicalDataState } from './technical-data.state';

import technicalData from '../../../test/assets/technical-data-1-2.json';

describe('TechnicalData', () => {
    let component: TechnicalData;
    let fixture: ComponentFixture<TechnicalData>;
    let document: AASDocument;

    beforeEach(async () => {
        document = {
            address: '',
            idShort: 'TechnicalDataAAS',
            timestamp: 0,
            id: 'https://admin-shell.io/aas/TechnicalData/1/2',
            endpoint: 'Test',
            content: technicalData as aas.Environment,
        };

        await TestBed.configureTestingModule({
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
            imports: [TechnicalData],
        }).compileComponents();

        fixture = TestBed.createComponent(TechnicalData);
        fixture.componentRef.setInput('state', TestBed.inject(TechnicalDataState));
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have a document after input', () => {
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();
        expect(component.document()).toBeDefined();
    });

    it('should have data sheets after input', () => {
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();
        expect(component.dataSheets().length).toBeGreaterThan(0);
    });
});
