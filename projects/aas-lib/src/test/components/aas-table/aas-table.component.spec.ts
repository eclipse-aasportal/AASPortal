/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AASDocument } from 'aas-core';

import { AASTableComponent } from '../../../lib/components/aas-table/aas-table.component';
import { NotifyService } from '../../../lib/features/notify/notify.service';
import { createDocument } from '../../assets/test-document';
import { ViewMode } from '../../../lib/types';

describe('AASTableComponent', () => {
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
                    useValue: jasmine.createSpyObj<NotifyService>(['error', 'info', 'log']),
                },
                provideZonelessChangeDetection(),
            ],
            imports: [
                AASTableComponent,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(AASTableComponent);
        const component = fixture.componentInstance;
        fixture.componentRef.setInput('viewMode', ViewMode.List);
        fixture.componentRef.setInput('documents', [document1, document2, document3]);
        fixture.detectChanges();
       expect(component).toBeTruthy();
    });

    it('provides a rows property', () => {
        const fixture = TestBed.createComponent(AASTableComponent);
        const component = fixture.componentInstance;
        fixture.componentRef.setInput('viewMode', ViewMode.List);
        fixture.componentRef.setInput('documents', [document1, document2, document3]);
        fixture.detectChanges();
        expect(component.rows()).toBeTruthy();
    });
});