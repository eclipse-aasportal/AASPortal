/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { NotifyService } from '../../../lib/components/notify/notify.service';
import { NotifyComponent } from '../../../lib/components/notify/notify.component';
import { createSpyObj, FakeLoader } from '../../mocks';

describe('NotifyComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NotifyComponent],
            providers: [
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error', 'clear'], { messages: signal([]) }),
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(NotifyComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});