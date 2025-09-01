/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { aas, AASDocument } from 'aas-core';
import { HandoverDocumentation } from '../../../lib/views/handover-documentation/handover-documentation';
import { FakeLoader } from '../../mocks';
import { HandoverDocumentationState } from '../../../lib/views/handover-documentation/handover-documentation.state';

import handoverDocumentation_1_2 from '../../assets/handover-documentation-1-2.json';

describe('HandoverDocumentation', () => {
    let component: HandoverDocumentation;
    let fixture: ComponentFixture<HandoverDocumentation>;
    let document: AASDocument;
    let state: Partial<HandoverDocumentationState>;

    beforeEach(async () => {
        document = {
            address: '',
            crc32: 0,
            idShort: 'HandoverDocumentation',
            readonly: false,
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/HandoverDocumentation/1/2',
            endpoint: 'Test',
            content: handoverDocumentation_1_2 as aas.Environment,
        };

        state = {
            items: signal([]).asReadonly(),
            document: signal(null).asReadonly(),
            update: jest.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [HandoverDocumentation],
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

        fixture = TestBed.createComponent(HandoverDocumentation);
        fixture.componentRef.setInput('state', state);
        fixture.componentRef.setInput('document', document);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should has a document', () => {
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();
        expect(component.document()).toBeDefined();
    });

    it('should has document items', () => {
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();
        expect(component.items()).toBeDefined();
    });
});
