/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AASDocument } from 'common';

import { AASTableComponent } from '../../lib/aas-table/aas-table.component';
import { MaxLengthPipe } from '../../lib/max-length.pipe';
import { SortableHeaderDirective } from '../../lib/sortable-header.directive';
import { NotifyService } from '../../lib/notify/notify.service';
import { createDocument } from '../assets/test-document';
import { ViewMode } from '../../lib/types/view-mode';

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
            declarations: [AASTableComponent, MaxLengthPipe, SortableHeaderDirective],
            providers: [
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error', 'info', 'log']),
                },
            ],
            imports: [
                CommonModule,
                NgbModule,
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
        fixture.detectChanges();

        component.viewMode = ViewMode.List;
        component.documents = [document1, document2, document3];
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a rows property', () => {
        expect(component.rows).toBeTruthy();
    });
});
