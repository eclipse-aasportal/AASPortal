/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, vitest } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { aas, AASDocument } from 'aas-core';
import { HandoverDocumentation } from './handover-documentation';
import { FakeLoader } from '../../../test/mocks';
import { HandoverDocumentationState } from './handover-documentation.state';

import handoverDocumentation_1_2 from '../../../test/assets/handover-documentation-1-2.json';

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
            update: vitest.fn(),
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
        expect(component.document()).toBeDefined();
    });

    it('should has document items', () => {
        expect(component.items()).toBeDefined();
    });

    it('should has collapsed', () => {
        expect(component.collapsed()).toBe(false);
    });
});
