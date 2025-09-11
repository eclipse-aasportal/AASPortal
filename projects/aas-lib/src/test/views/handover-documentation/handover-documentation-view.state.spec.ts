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
import { aas, AASDocument } from 'aas-core';

import { HandoverDocumentationViewState as HandoverDocumentationViewState } from '../../../lib/views/handover-documentation/handover-documentation-view.state';
import { HandoverDocumentationState } from '../../../lib/views/handover-documentation/handover-documentation.state';
import { FakeLoader } from '../../mocks';

import handoverDocumentation_1_2 from '../../assets/handover-documentation-1-2.json';

describe('HandoverDocumentationViewState', () => {
    let service: HandoverDocumentationViewState;
    let document: AASDocument;
    let submodel: aas.Submodel;

    beforeEach(() => {
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

        service = TestBed.inject(HandoverDocumentationViewState);
        service.update({ tuples: [[document, submodel]] });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should provide the state for the HandoverDocumentation component', () => {
        expect(service.handoverDocumentationState).toBeInstanceOf(HandoverDocumentationState);
    });

    it('should provide tuples', () => {
        expect(service.tuples()).toEqual([[document, submodel]]);
    });
});
