/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { AASDocument } from 'aas-core';
import { CustomerFeedbackView } from '../../../lib/internal';
import { ToolbarService } from '../../../lib/services/toolbar.service';
import { StartService } from '../../../lib/services/start.service';
import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { encodeBase64Url } from '../../../lib/utilities';

describe('CustomerFeedbackView', () => {
    let start: jasmine.SpyObj<StartService>;
    let api: jasmine.SpyObj<EndpointsApi>;
    let route: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(async () => {
        start = jasmine.createSpyObj<StartService>(['add', 'save']);
        api = jasmine.createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        route = jasmine.createSpyObj<ActivatedRoute>(
            {},
            { params: of({ endpoint: encodeBase64Url('endpoint'), id: encodeBase64Url('http://localhost/aas') }) },
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

        await TestBed.configureTestingModule({
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
                    provide: EndpointsApi,
                    useValue: api,
                },
                provideZonelessChangeDetection(),
            ],
            imports: [
                CustomerFeedbackView,
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
        const fixture = TestBed.createComponent(CustomerFeedbackView);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
