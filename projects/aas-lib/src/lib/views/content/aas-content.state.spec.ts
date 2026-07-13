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

import { AASContentState } from './aas-content.state';
import { FakeLoader } from '../../../test/mocks';

describe.skip('AASContentState', () => {
    let service: AASContentState;

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

        service = TestBed.inject(AASContentState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
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
});
