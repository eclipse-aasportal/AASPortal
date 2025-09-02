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

import { DocumentBrowserState } from '../../../lib/views/document-browser/document-browser.state';
import { FakeLoader } from '../../mocks';

describe('DocumentBrowserState', () => {
    let service: DocumentBrowserState;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                DocumentBrowserState,
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ]
        });

        service = TestBed.inject(DocumentBrowserState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});