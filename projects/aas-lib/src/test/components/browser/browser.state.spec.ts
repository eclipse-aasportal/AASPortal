/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { FakeLoader } from '../../mocks';

import { BrowserData, BrowserElement, BrowserState } from '../../../lib/components/browser/browser.state';
import { aas } from 'projects/aas-core/dist/types';

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

    describe('update', () => {
        it('should update the state with new values', () => {
            const env: aas.Environment = {
                assetAdministrationShells: [
                    {
                        assetInformation: {
                            assetKind: 'Instance',
                        },
                        id: 'id',
                        idShort: 'idShort',
                        modelType: 'SubmodelElementCollection',
                    },
                ],
                conceptDescriptions: [{
                    id: 'cdId',
                    idShort: 'cdIdShort',
                    modelType: 'SubmodelElementCollection'
                }],
                submodels: [{
                    id: 'smId',
                    idShort: 'smIdShort',
                    modelType: 'SubmodelElementCollection'
                }],
            };

            const current: BrowserElement = {
                name: '',
                referable: {
                    idShort: '',
                    modelType: 'SubmodelElementCollection'
                },
                properties: [],
                children: []
            };

            const path: BrowserElement[] = [current];

            const newState: Partial<BrowserData> = { env, current, path };
            service.update(newState);
            expect(service.env()).toEqual(newState.env);
            expect(service.current()).toEqual(newState.current);
            expect(service.path()).toEqual(newState.path);
        });
    });
});