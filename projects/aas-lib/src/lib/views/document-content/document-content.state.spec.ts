/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { DocumentContentState, DocumentStateData } from './document-content.state';
import { FakeLoader } from '../../../test/mocks';

describe('DocumentContentState', () => {
    let service: DocumentContentState;

    beforeEach(() => {
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

        service = TestBed.inject(DocumentContentState);
    });

    it('should be created', () => {
        expect(service).toBeInstanceOf(DocumentContentState);
    });

    it('provides the current active document', () => {
        expect(service.document()).toBeNull();
    });

    it('provides the current live state', () => {
        expect(service.live()).toEqual('offline');
    });

    it('provides the current search expression', () => {
        expect(service.searchExpression()).toEqual('');
    });

    it('provides a list of the current selected elements', () => {
        expect(service.selectedElements()).toEqual([]);
    });

    it('can update the state', () => {
        const newState = {
            document: {
                id: 'doc1',
                content: null,
                address: '',
                crc32: 0,
                idShort: '',
                readonly: false,
                timestamp: 0,
                endpoint: '',
            },
            live: 'online' as const,
            searchExpression: 'test',
            selectedElements: [
                {
                    idShort: 'element1',
                    modelType: 'AnnotatedRelationshipElement',
                },
            ],
        } satisfies Partial<DocumentStateData>;

        service.update(newState);

        expect(service.document()).toEqual(newState.document);
        expect(service.live()).toEqual(newState.live);
        expect(service.searchExpression()).toEqual(newState.searchExpression);
        expect(service.selectedElements()).toEqual(newState.selectedElements);
    });
});
