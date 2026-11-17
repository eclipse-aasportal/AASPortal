/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { first, lastValueFrom, of } from 'rxjs';

import { aas, AASDocument } from 'aas-core';
import { ToolbarService } from '../../shared/services/toolbar.service';
import { StartService } from '../../shared/services/start.service';
import { EndpointsApi } from '../../shared/services/endpoints-api';
import { encodeBase64Url } from '../../utilities';
import { VIEW_ROUTES } from '../views-routes';
import { CustomerFeedbackView } from './customer-feedback-view';
import { createSpyObj } from '../../../test/mocks';
import { CUSTOMER_FEEDBACK } from '../views-constants';

function property(idShort: string, value: string): aas.Property {
    return {
        idShort,
        modelType: 'Property',
        valueType: 'xs:string',
        value,
    };
}

function collection(idShort: string, value: aas.SubmodelElement[]): aas.SubmodelElementCollection {
    return {
        idShort,
        modelType: 'SubmodelElementCollection',
        value,
    };
}

function feedback(idShort: string, score: string, stars: string, message: string): aas.SubmodelElementCollection {
    return collection(idShort, [
        collection('General', [collection('Service', [property('Score', score)])]),
        property('stars', stars),
        property('message', message),
    ]);
}

describe('CustomerFeedbackView', () => {
    let start: Mocked<StartService>;
    let api: Mocked<EndpointsApi>;
    let route: Mocked<ActivatedRoute>;
    let document: AASDocument;

    beforeEach(async () => {
        start = createSpyObj<StartService>(['add', 'save']);
        api = createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        document = {
            address: '',
            idShort: 'CustomerFeedbackAAS',
            timestamp: 0,
            id: 'http://localhost/aas',
            endpoint: 'endpoint',
            content: {
                assetAdministrationShells: [],
                submodels: [
                    {
                        id: 'http://localhost/customer-feedback',
                        idShort: 'CustomerFeedback',
                        modelType: 'Submodel',
                        semanticId: {
                            type: 'ExternalReference',
                            keys: [{ type: 'GlobalReference', value: CUSTOMER_FEEDBACK }],
                        },
                        submodelElements: [
                            feedback('Feedback1', '4', '4', 'Excellent service'),
                            feedback('Feedback2', '2', '2', 'Could be better'),
                        ],
                    },
                ],
            } satisfies aas.Environment,
        };
        route = createSpyObj<ActivatedRoute>(
            {},
            {
                params: of({ endpoint: encodeBase64Url(document.endpoint), id: encodeBase64Url(document.id) }),
                queryParams: of({}),
            },
        );

        api.getDocument.mockReturnValue(of(document));

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
                provideTranslateService(),
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

    it('aggregates ratings and feedbacks from the customer feedback submodel', () => {
        const fixture = TestBed.createComponent(CustomerFeedbackView);
        const component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.document()).toBe(document);
        expect(component.count()).toBe(1);
        expect(component.stars()).toBe(3);
        expect(component.overallRating()).toBe(2);
        expect(component.items()).toEqual([
            {
                name: 'CustomerFeedback.Service',
                score: 3,
                sum: 6,
                count: 2,
                like: true,
            },
        ]);
        expect(component.feedbacks().map(feedback => feedback.message)).toEqual([
            'Excellent service',
            'Could be better',
        ]);
    });

    it('adds the aggregated feedback to the start page', async () => {
        start.add.mockReturnValue(true);
        start.save.mockReturnValue(of(void 0));
        const fixture = TestBed.createComponent(CustomerFeedbackView);
        const component = fixture.componentInstance;
        fixture.detectChanges();

        await lastValueFrom(component.addToStart().pipe(first()));

        expect(start.add).toHaveBeenCalledWith(
            'CustomerFeedback',
            expect.any(String),
            expect.objectContaining({
                count: 1,
                stars: 3,
                overallRating: 2,
                href: `/view/CustomerFeedback;endpoint=${encodeBase64Url(document.endpoint)};id=${encodeBase64Url(document.id)}`,
            }),
        );
        expect(start.save).toHaveBeenCalledOnce();
    });
});
