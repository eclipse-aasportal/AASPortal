/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { DocumentBrowserViewState } from './document-browser-view.state';

describe('DocumentBrowserViewState', () => {
    let service: DocumentBrowserViewState;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DocumentBrowserViewState, provideTranslateService()],
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
