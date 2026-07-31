/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, vitest } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { aas, AASDocument } from 'aas-core';
import { Nameplate } from './nameplate';
import { FakeLoader } from '../../../test/mocks';
import { NameplateState } from './nameplate.state';

import nameplate_3_0 from '../../../test/assets/nameplate-3-0.json';

describe('Nameplate', () => {
    let component: Nameplate;
    let fixture: ComponentFixture<Nameplate>;
    let document: AASDocument;
    let state: Partial<NameplateState>;

    beforeEach(async () => {
        document = {
            address: '',
            idShort: 'DigitalNameplate',
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/DigitalNameplate/3/0',
            endpoint: 'Test',
            content: nameplate_3_0 as aas.Environment,
        };

        state = {
            dataSheets: signal([]).asReadonly(),
            document: signal(null).asReadonly(),
            update: vitest.fn(),
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
