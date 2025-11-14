/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
<<<<<<< HEAD
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
=======
import { provideTranslateService, TranslateLoader, TranslateModule } from '@ngx-translate/core';
>>>>>>> development
import { AASDocument } from 'aas-core';

import { AASTable } from '../../../lib/components/aas-table/aas-table';
import { NotifyService } from '../../../lib/components/notify/notify.service';
import { createDocument } from '../../assets/test-document';
import { createSpyObj, FakeLoader } from '../../mocks';
<<<<<<< HEAD

describe('AASTableComponent', () => {
=======
import { ActivatedRoute } from '@angular/router';

describe('AASTable', () => {
>>>>>>> development
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
                    useValue: createSpyObj<NotifyService>(['error', 'info', 'log']),
                },
<<<<<<< HEAD
                provideZonelessChangeDetection(),
            ],
            imports: [
                AASTable,
                TranslateModule.forRoot({
=======
                {
                    provide: ActivatedRoute,
                    useValue: createSpyObj<ActivatedRoute>([]),
                },
                provideTranslateService({
>>>>>>> development
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
<<<<<<< HEAD
            ],
=======
                provideZonelessChangeDetection(),
            ],
            imports: [AASTable],
>>>>>>> development
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(AASTable);
        const component = fixture.componentInstance;
        fixture.componentRef.setInput('documents', [document1, document2, document3]);
        fixture.detectChanges();
<<<<<<< HEAD
       expect(component).toBeTruthy();
=======
        expect(component).toBeTruthy();
>>>>>>> development
    });

    it('provides a rows property', () => {
        const fixture = TestBed.createComponent(AASTable);
        const component = fixture.componentInstance;
        fixture.componentRef.setInput('documents', [document1, document2, document3]);
        fixture.detectChanges();
        expect(component.rows()).toBeTruthy();
    });
<<<<<<< HEAD
});
=======
});
>>>>>>> development
