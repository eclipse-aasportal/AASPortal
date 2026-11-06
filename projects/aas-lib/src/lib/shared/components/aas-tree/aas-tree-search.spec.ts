/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AASTreeSearch } from './aas-tree-search';
import { NotifyService } from '../../../core/notify/notify.service';
import { createSpyObj } from '../../../../test/mocks';

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
                provideTranslateService(),
            ],
            imports: [],
        });

        search = TestBed.inject(AASTreeSearch);
    });

    it('should create', () => {
        expect(search).toBeTruthy();
    });
});
