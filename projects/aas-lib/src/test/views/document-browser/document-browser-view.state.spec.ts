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

import { DocumentBrowserViewState } from '../../../lib/views/document-browser/document-browser-view.state';
import { FakeLoader } from '../../mocks';

describe('DocumentBrowserViewState', () => {
    let service: DocumentBrowserViewState;

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

        service = TestBed.inject(DocumentBrowserViewState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should provide a state for Browser component', () => {
        expect(service.browserState).toBeDefined();
    });
});
