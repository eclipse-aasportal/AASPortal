/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { AASDocument } from 'aas-core';
import { CustomerFeedbackComponent } from '../../../lib/views/customer-feedback/customer-feedback.component';
import { ToolbarService } from '../../../lib/toolbar.service';
import { StartService } from '../../../lib/start.service';
import { DocumentsService } from '../../../lib/services/documents.service';
import { encodeBase64Url } from '../../../lib/utilities';

describe('CustomerFeedbackComponent', () => {
    let component: CustomerFeedbackComponent;
    let fixture: ComponentFixture<CustomerFeedbackComponent>;
    let start: jasmine.SpyObj<StartService>;
    let api: jasmine.SpyObj<DocumentsService>;
    let route: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(() => {
        start = jasmine.createSpyObj<StartService>(['add', 'save']);
        api = jasmine.createSpyObj<DocumentsService>(['getDocument', 'getContent']);
        route = jasmine.createSpyObj<ActivatedRoute>(
            {},
            { queryParams: of({ endpoint: encodeBase64Url('endpoint'), id: encodeBase64Url('http://localhost/aas') }) },
        );

        api.getDocument.and.returnValue(
            of({
                address: '',
                crc32: 0,
                idShort: '',
                readonly: false,
                timestamp: 0,
                id: 'http://localhost/aas',
                endpoint: 'endpoint',
            } satisfies AASDocument),
        );

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: route,
                },
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) }),
                },
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: DocumentsService,
                    useValue: api,
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

        fixture = TestBed.createComponent(CustomerFeedbackComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
