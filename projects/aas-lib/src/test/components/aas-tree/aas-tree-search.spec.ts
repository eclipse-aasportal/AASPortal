/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { AASTreeSearch } from '../../../lib/components/aas-tree/aas-tree-search';
import { NotifyService } from '../../../lib/components/notify/notify.service';
import { createSpyObj, FakeLoader } from '../../mocks';

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
                })
            ],
            imports: [],
        });

        search = TestBed.inject(AASTreeSearch);
    });

    it('should create', () => {
        expect(search).toBeTruthy();
    });
});
