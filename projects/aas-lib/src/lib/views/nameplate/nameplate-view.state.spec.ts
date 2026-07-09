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
import { NameplateViewState } from './nameplate-view.state';
import { NameplateState } from './nameplate.state';
import { FakeLoader } from '../../../test/mocks';

import nameplate_3_0 from '../../../test/assets/nameplate-3-0.json';

describe('NameplateViewState', () => {
    let service: NameplateViewState;
    let document: AASDocument;
    let submodel: aas.Submodel;

    beforeEach(() => {
        document = {
            address: '',
            crc32: 0,
            idShort: 'DigitalNameplate',
            readonly: false,
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/DigitalNameplate/3/0',
            endpoint: 'Test',
            content: nameplate_3_0 as aas.Environment,
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

        service = TestBed.inject(NameplateViewState);
        service.update({ tuples: [[document, submodel]] });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should provide the state for the Nameplate component', () => {
        expect(service.nameplateState).toBeInstanceOf(NameplateState);
    });

    it('should provide tuples', () => {
        expect(service.tuples()).toEqual([[document, submodel]]);
    });
});
