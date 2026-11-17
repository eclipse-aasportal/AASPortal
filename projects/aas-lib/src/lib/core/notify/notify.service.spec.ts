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
import { NotifyService } from '../../../lib/core/notify/notify.service';

describe('NotifyService', () => {
    let service: NotifyService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideTranslateService()],
            imports: [],
        });

        service = TestBed.inject(NotifyService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
