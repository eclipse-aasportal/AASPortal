/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { AASTreeSearch } from './aas-tree-search';
import { NotifyService } from '../../core/notify/notify.service';
import { createSpyObj, FakeLoader } from '../../../test/mocks';

describe('AASTreeSearch', () => {
    let search: AASTreeSearch;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AASTreeSearch,
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error']),
                },
                provideZonelessChangeDetection(),
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
            imports: [],
        });

        search = TestBed.inject(AASTreeSearch);
    });

    it('should create', () => {
        expect(search).toBeTruthy();
    });
});
