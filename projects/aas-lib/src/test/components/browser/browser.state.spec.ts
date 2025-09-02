/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { FakeLoader } from '../../mocks';

import { BrowserState } from '../../../lib/components/browser/browser.state';

describe('BrowserState', () => {
    let service: BrowserState;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                BrowserState,
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
        });

        service = TestBed.inject(BrowserState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service.current()).toBeNull();
        expect(service.env()).toEqual({
            assetAdministrationShells: [],
            conceptDescriptions: [],
            submodels: [],
        });
        
        expect(service.path()).toEqual([]);
    });
});
