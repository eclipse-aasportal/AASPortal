/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { aas, AASDocument } from 'aas-core';
import { Nameplate } from '../../../lib/views/nameplate/nameplate';
import { FakeLoader } from '../../mocks';
import { NameplateState } from '../../../lib/views/nameplate/nameplate.state';

import nameplate_3_0 from '../../assets/nameplate-3-0.json';

describe('Nameplate', () => {
    let component: Nameplate;
    let fixture: ComponentFixture<Nameplate>;
    let document: AASDocument;
    let state: Partial<NameplateState>;

    beforeEach(async () => {
        document = {
            address: '',
            crc32: 0,
            idShort: 'DigitalNameplate',
            readonly: false,
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/DigitalNameplate/3/0',
            endpoint: 'Test',
            content: nameplate_3_0 as aas.Environment,
        };

        state = {
            dataSheets: signal([]).asReadonly(),
            document: signal(null).asReadonly(),
            update: jest.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [Nameplate],
            providers: [
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(Nameplate);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('state', state);
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides the nameplate as data sheets', () => {
        expect(component.dataSheets()).toEqual([]);
    });

    it('has an AAS document as input', () => {
        expect(state.update).toHaveBeenCalled();
    });
});
