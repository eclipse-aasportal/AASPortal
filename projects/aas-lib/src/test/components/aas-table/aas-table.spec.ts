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
import { AASDocument } from 'aas-core';

import { AASTable } from '../../../lib/components/aas-table/aas-table';
import { NotifyService } from '../../../lib/core/notify/notify.service';
import { createDocument } from '../../assets/test-document';
import { createSpyObj, FakeLoader } from '../../mocks';
import { ActivatedRoute } from '@angular/router';

describe('AASTable', () => {
    let document1: AASDocument;
    let document2: AASDocument;
    let document3: AASDocument;

    beforeEach(async () => {
        document1 = createDocument('document1');
        document2 = createDocument('document2');
        document3 = createDocument('document3');

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error', 'info']),
                },
                {
                    provide: ActivatedRoute,
                    useValue: createSpyObj<ActivatedRoute>([]),
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [AASTable],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(AASTable);
        const component = fixture.componentInstance;
        fixture.componentRef.setInput('documents', [document1, document2, document3]);
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('provides a rows property', () => {
        const fixture = TestBed.createComponent(AASTable);
        const component = fixture.componentInstance;
        fixture.componentRef.setInput('documents', [document1, document2, document3]);
        fixture.detectChanges();
        expect(component.items()).toBeTruthy();
    });
});
