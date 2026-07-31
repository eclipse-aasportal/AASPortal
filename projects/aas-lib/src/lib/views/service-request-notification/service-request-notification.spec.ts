/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';

import { aas, AASDocument } from 'aas-core';
import { ServiceRequestNotification } from './service-request-notification';
import { createSpyObj, FakeLoader } from '../../../test/mocks';
import { StartService } from '../../shared/services/start.service';
import { ToolbarService } from '../../shared/services/toolbar.service';
import { encodeBase64Url } from '../../utilities';
import { VIEW_ROUTES } from '../views-routes';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { EndpointsApi } from '../../shared/services/endpoints-api';

@Component({
    selector: 'fhg-thumbnail-qrcode',
    template: '<div></div>',
    styleUrls: [],
})
export class TestThumbnailQRCode {
    public readonly document = input<AASDocument>();
}

describe('ServiceRequestNotification', () => {
    let component: ServiceRequestNotification;
    let fixture: ComponentFixture<ServiceRequestNotification>;
    let start: Mocked<StartService>;
    let toolbar: Mocked<ToolbarService>;
    let route: Mocked<ActivatedRoute>;
    let api: Mocked<EndpointsApi>;
    let document: AASDocument;

    beforeEach(async () => {
        start = createSpyObj<StartService>(['add']);
        start.add.mockReturnValue(true);
        toolbar = createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) });

        document = {
            address: '',
            idShort: 'ServiceRequestNotificationAAS',
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/HierarchicalStructuresBoM/1/1',
            endpoint: 'Test',
            content: {
                assetAdministrationShells: [],
                conceptDescriptions: [],
                submodels: [
                    {
                        id: 'http://aas/ServiceRequestNotification',
                        idShort: 'ServiceRequestNotification',
                        modelType: 'Submodel',
                    } satisfies aas.Submodel,
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

        api = createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        api.getDocument.mockReturnValue(of(document));

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: ToolbarService,
                    useValue: toolbar,
                },
                {
                    provide: ActivatedRoute,
                    useValue: route,
                },
                {
                    provide: EndpointsApi,
                    useValue: api,
                },
                {
                    provide: VIEW_ROUTES,
                    useValue: [
                        {
                            path: 'ServiceRequestNotification',
                            component: ServiceRequestNotification,
                            data: {
                                type: 'Leaf',
                                idShorts: ['ServiceRequestNotification'],
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
            imports: [ServiceRequestNotification],
        }).compileComponents();

        TestBed.overrideComponent(ServiceRequestNotification, {
            remove: { imports: [ThumbnailQRCode] },
            add: { imports: [TestThumbnailQRCode] },
        });

        fixture = TestBed.createComponent(ServiceRequestNotification);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
