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

import { NameplateViewState } from '../../../lib/views/nameplate/nameplate-view.state';
import { FakeLoader } from '../../mocks';

describe('NameplateViewState', () => {
    let service: NameplateViewState;

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

        service = TestBed.inject(NameplateViewState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service.nameplateState).toBeDefined();
    });
});
