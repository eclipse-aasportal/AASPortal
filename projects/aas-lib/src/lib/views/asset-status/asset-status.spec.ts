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
import { createSpyObj, FakeLoader } from '../../../test/mocks';
import { StartService } from '../../shared/services/start.service';
import { ToolbarService } from '../../shared/services/toolbar.service';
import { encodeBase64Url } from '../../utilities';
import { VIEW_ROUTES } from '../views-routes';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { EndpointsApi } from '../../shared/services/endpoints-api';
import { AssetStatus } from './asset-status';

import asset_status from '../../../test/assets/asset-status.json';

@Component({
    selector: 'fhg-thumbnail-qrcode',
    template: '<div></div>',
    styleUrls: [],
})
export class TestThumbnailQRCode {
    public readonly document = input<AASDocument>();
}

describe('ServiceRequestNotification', () => {
    let component: AssetStatus;
    let fixture: ComponentFixture<AssetStatus>;
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
            idShort: 'Kannegiesser_XFM',
            timestamp: 0,
            id: 'https://www.smartfactory-owl.de/kannegiesser/xfm',
            endpoint: 'Test',
            content: asset_status as aas.Environment,
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
                            path: 'AssetStatus',
                            component: AssetStatus,
                            data: {
                                type: 'Leaf',
                                idShorts: ['AssetStatus'],
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
            imports: [AssetStatus],
        }).compileComponents();

        TestBed.overrideComponent(AssetStatus, {
            remove: { imports: [ThumbnailQRCode] },
            add: { imports: [TestThumbnailQRCode] },
        });

        fixture = TestBed.createComponent(AssetStatus);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
