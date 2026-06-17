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
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { NotifyService } from '../../../lib/core/notify/notify.service';
import { FakeLoader } from '../../mocks';

describe('NotifyService', () => {
    let service: NotifyService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideZonelessChangeDetection()],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
        });

        service = TestBed.inject(NotifyService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
