/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { AASDocument } from 'aas-core';
import { ToolbarService } from '../../shared/services/toolbar.service';
import { StartService } from '../../shared/services/start.service';
import { EndpointsApi } from '../../shared/services/endpoints-api';
import { encodeBase64Url } from '../../utilities';
import { VIEW_ROUTES } from '../views-routes';
import { CustomerFeedbackView } from './customer-feedback-view';
import { createSpyObj, FakeLoader } from '../../../test/mocks';
import { CUSTOMER_FEEDBACK } from '../views-constants';

describe.skip('CustomerFeedbackView', () => {
    let start: Mocked<StartService>;
    let api: Mocked<EndpointsApi>;
    let route: Mocked<ActivatedRoute>;

    beforeEach(async () => {
        start = createSpyObj<StartService>(['add', 'save']);
        api = createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        route = createSpyObj<ActivatedRoute>(
            {},
            { params: of({ endpoint: encodeBase64Url('endpoint'), id: encodeBase64Url('http://localhost/aas') }) },
        );

        api.getDocument.mockReturnValue(
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
                    useValue: createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) }),
                },
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: EndpointsApi,
                    useValue: api,
                },
                {
                    provide: VIEW_ROUTES,
                    useValue: [
                        {
                            path: 'CustomerFeedback',
                            component: CustomerFeedbackView,
                            data: {
                                type: 'Leaf',
                                semanticIds: [CUSTOMER_FEEDBACK],
                            },
                        },
                    ],
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [CustomerFeedbackView],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(CustomerFeedbackView);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
