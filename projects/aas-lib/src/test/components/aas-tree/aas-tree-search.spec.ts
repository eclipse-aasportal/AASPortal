/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { AASTreeSearch } from '../../../lib/components/aas-tree/aas-tree-search';
import { NotifyService } from '../../../lib/components/notify/notify.service';
import { AASTreeStore } from '../../../lib/components/aas-tree/aas-tree.store';

describe('AASTreeSearch', () => {
    let search: AASTreeSearch;
    let store: AASTreeStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error']),
                },
                AASTreeStore,
                provideZonelessChangeDetection(),
            ],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        store = TestBed.inject(AASTreeStore);
        search = new AASTreeSearch(store, TestBed.inject(TranslateService));
    });

    it('should create', () => {
        expect(search).toBeTruthy();
    });
});
