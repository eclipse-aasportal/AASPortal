/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AASDocument } from 'aas-core';

import { AASTableComponent } from '../../lib/aas-table/aas-table.component';
import { NotifyService } from '../../lib/notify/notify.service';
import { createDocument } from '../assets/test-document';
import { ViewMode } from '../../lib/types';

describe('AASTableComponent', () => {
    let component: AASTableComponent;
    let fixture: ComponentFixture<AASTableComponent>;
    let document1: AASDocument;
    let document2: AASDocument;
    let document3: AASDocument;

    beforeEach(() => {
        document1 = createDocument('document1');
        document2 = createDocument('document2');
        document3 = createDocument('document3');

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error', 'info', 'log']),
                },
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

        fixture = TestBed.createComponent(AASTableComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('viewMode', ViewMode.List);
        fixture.componentRef.setInput('documents', [document1, document2, document3]);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a rows property', () => {
        expect(component.rows()).toBeTruthy();
    });
});