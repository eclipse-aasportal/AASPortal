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

import { HandoverDocumentationState } from '../../../lib/views/handover-documentation/handover-documentation.state';
import { aas, AASDocument } from 'aas-core';
import { FakeLoader } from '../../mocks';

import handoverDocumentation_1_2 from '../../assets/handover-documentation-1-2.json';

describe('HandoverDocumentationState', () => {
    let service: HandoverDocumentationState;
    let document: AASDocument;

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

        TestBed.configureTestingModule({
            providers: [
                HandoverDocumentationState,
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
        });

        service = TestBed.inject(HandoverDocumentationState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service.document()).toBeNull();
        expect(service.submodel()).toBeNull();
        expect(service.items()).toEqual([]);
    });

    it('should update the state', () => {
        service.update({ document });
        expect(service.document()).toBe(document);
        expect(service.submodel()).toBeDefined();
        expect(service.items()).toEqual([]);
    });
});
