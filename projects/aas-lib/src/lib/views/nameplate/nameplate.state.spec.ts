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
import { aas, AASDocument } from 'aas-core';

import { NameplateState } from './nameplate.state';
import { FakeLoader } from '../../../test/mocks';

import nameplate_3_0 from '../../../test/assets/nameplate-3-0.json';

describe('NameplateState', () => {
    let service: NameplateState;
    let document: AASDocument;

    beforeEach(() => {
        document = {
            address: '',
            idShort: 'DigitalNameplate',
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/DigitalNameplate/3/0',
            endpoint: 'Test',
            content: nameplate_3_0 as aas.Environment,
        };

        TestBed.configureTestingModule({
            providers: [
                NameplateState,
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),

                provideZonelessChangeDetection(),
            ],
        });

        service = TestBed.inject(NameplateState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service.document()).toBeNull();
        expect(service.dataSheets()).toEqual([]);
    });

    it('should update the state', () => {
        service.update({ document });
        expect(service.document()).toBe(document);
        expect(service.dataSheets()).toEqual([]);
    });
});
