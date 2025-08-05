/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { aas, AASDocument } from 'aas-core';
import { HandoverDocumentation } from '../../../lib/views/handover-documentation/handover-documentation';
import { HANDOVER_DOCUMENTATION_1_2 } from '../../../lib/views/views-constants';

import handoverDocumentation_1_2 from '../../assets/handover-documentation-1-2.json';

describe('HandoverDocumentation', () => {
    let component: HandoverDocumentation;
    let fixture: ComponentFixture<HandoverDocumentation>;
    let document: AASDocument;

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

        await TestBed.configureTestingModule({
            imports: [
                HandoverDocumentation,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
            providers: [provideZonelessChangeDetection()],
        }).compileComponents();

        fixture = TestBed.createComponent(HandoverDocumentation);
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

    it('should has a submodel', () => {
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();
        expect(component.submodel()).toBeDefined();
    });

    it('should has a semanticId', () => {
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();
        expect(component.semanticId()).toEqual(HANDOVER_DOCUMENTATION_1_2);
    });

    it('should has document items', () => {
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();
        expect(component.items()).toBeDefined();
    });
});
