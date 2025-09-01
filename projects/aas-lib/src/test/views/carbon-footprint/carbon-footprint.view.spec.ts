/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ActivatedRoute, provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { aas, AASDocument } from 'aas-core';
import { ToolbarService } from '../../../lib/services/toolbar.service';
import { StartService } from '../../../lib/services/start.service';
import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { encodeBase64Url } from '../../../lib/utilities';
import carbon_footprint_0_9 from '../../assets/carbon-footprint-0-9.json';
import { VIEW_ROUTES } from '../../../lib/types';
import { viewRoutes } from '../../../lib/views/views-routes';
import { CarbonFootprintView } from '../../../lib/views/carbon-footprint/carbon-footprint-view';
import { CarbonFootprint } from '../../../lib/views/carbon-footprint/carbon-footprint';
import { ThumbnailQRCode } from '../../../lib/views/thumbnail-qrcode/thumbnail-qrcode';
import { createSpyObj, FakeLoader } from '../../mocks';
import { CarbonFootprintState } from 'projects/aas-lib/src/lib/views/carbon-footprint/carbon-footprint.state';

@Component({
    selector: 'fhg-thumbnail-qrcode',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestThumbnailQRCode {
    public readonly document = input<AASDocument>();
}

@Component({
    selector: 'fhg-carbon-footprint',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestCarbonFootprint {
    public readonly document = input<AASDocument>();
    public readonly collapsed = input(true);
    public readonly state = input<CarbonFootprintState>();
}

describe('CarbonFootprintView', () => {
    let component: CarbonFootprintView;
    let fixture: ComponentFixture<CarbonFootprintView>;
    let api: jest.Mocked<EndpointsApi>;
    let start: jest.Mocked<StartService>;
    let route: jest.Mocked<ActivatedRoute>;
    let document: AASDocument;

    beforeEach(async () => {
        api = createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        start = createSpyObj<StartService>(['add', 'save']);
        document = {
            address: '',
            crc32: 0,
            idShort: 'CarbonFootprint',
            readonly: false,
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/CarbonFootprint/0/9',
            endpoint: 'Test',
            content: carbon_footprint_0_9 as aas.Environment,
        };

        route = createSpyObj<ActivatedRoute>(
            {},
            { queryParams: of({ endpoint: encodeBase64Url(document.endpoint), id: encodeBase64Url(document.id) }) },
        );

        api.getDocument.mockReturnValue(of(document));

        await TestBed.configureTestingModule({
            imports: [CarbonFootprintView],
            providers: [
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
                    useValue: viewRoutes,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideRouter([]),
                provideZonelessChangeDetection(),
            ],
        }).compileComponents();

        TestBed.overrideComponent(CarbonFootprintView, {
            remove: { imports: [CarbonFootprint, ThumbnailQRCode] },
            add: { imports: [TestCarbonFootprint, TestThumbnailQRCode] },
        });

        fixture = TestBed.createComponent(CarbonFootprintView);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
