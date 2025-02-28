/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { AASTreeSearch } from '../../lib/aas-tree/aas-tree-search';
import { NotifyService } from '../../lib/notify/notify.service';
import { AASTreeStore } from '../../lib/aas-tree/aas-tree.store';

describe('AASTreeSearch', function () {
    let search: AASTreeSearch;
    let store: AASTreeStore;

    beforeEach(async function () {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error']),
                },
                AASTreeStore,
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