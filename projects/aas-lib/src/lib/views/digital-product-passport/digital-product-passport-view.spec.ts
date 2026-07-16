/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { AASDocument } from 'aas-core';

import { EndpointsApi } from '../../services/endpoints-api';
import { ToolbarService } from '../../share/services/toolbar.service';
import { StartService } from '../../services/start.service';
import { encodeBase64Url } from '../../utilities';
import { VIEW_ROUTES } from '../views-routes';
import { DigitalProductPassportView } from './digital-product-passport-view';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { createSpyObj, FakeLoader } from '../../../test/mocks';
import { Nameplate } from '../nameplate/nameplate';
import { CarbonFootprint } from '../carbon-footprint/carbon-footprint';
import { HandoverDocumentation } from '../handover-documentation/handover-documentation';
import { NameplateState } from '../nameplate/nameplate.state';
import { CarbonFootprintState } from '../carbon-footprint/carbon-footprint.state';
import { HandoverDocumentationState } from '../handover-documentation/handover-documentation.state';
import { NameplateView } from '../nameplate/nameplate-view';
import { HandoverDocumentationView } from '../handover-documentation/handover-documentation-view';
import { CarbonFootprintView } from '../carbon-footprint/carbon-footprint-view';
import {
    CARBON_FOOTPRINT_0_9,
    CARBON_FOOTPRINT_1_0,
    HANDOVER_DOCUMENTATION_1_2,
    HANDOVER_DOCUMENTATION_2_0,
    NAMEPLATE_2_0,
    NAMEPLATE_3_0,
    NAMEPLATE_FHG,
    NAMEPLATE_HSU,
} from '../views-constants';

import sample from '../../../test/assets/dpp-sample.json';

@Component({
    selector: 'fhg-thumbnail-qrcode',
    template: '<div></div>',
    styleUrls: [],
})
export class TestThumbnailQRCode {
    public readonly document = input<AASDocument>();
}

@Component({
    selector: 'fhg-nameplate',
    template: '<div></div>',
    styleUrls: [],
})
export class TestNameplate {
    public readonly document = input<AASDocument>();
    public readonly state = input<NameplateState>();
}

@Component({
    selector: 'fhg-carbon-footprint',
    template: '<div></div>',
    styleUrls: [],
})
export class TestCarbonFootprint {
    public readonly document = input<AASDocument>();
    public readonly state = input<CarbonFootprintState>();
    public readonly isDigitalProductPassport = input<boolean>();
}

@Component({
    selector: 'fhg-handover-documentation',
    template: '<div></div>',
    styleUrls: [],
})
export class TestHandoverDocumentation {
    public readonly document = input<AASDocument>();
    public readonly collapsed = input<boolean>();
    public readonly state = input<HandoverDocumentationState>();
}

describe('DigitalProductPassportView', () => {
    let api: Mocked<EndpointsApi>;
    let start: Mocked<StartService>;
    let route: Mocked<ActivatedRoute>;

    beforeEach(async () => {
        api = createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        start = createSpyObj<StartService>(['add', 'save']);
        route = createSpyObj<ActivatedRoute>(
            {},
            {
                params: of({ endpoint: encodeBase64Url(sample.endpoint), id: encodeBase64Url(sample.id) }),
                queryParams: of({}),
            },
        );

        api.getDocument.mockReturnValue(of(sample as AASDocument));

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
                            path: 'CarbonFootprint',
                            component: CarbonFootprintView,
                            data: {
                                type: 'Leaf',
                                semanticIds: [CARBON_FOOTPRINT_1_0, CARBON_FOOTPRINT_0_9],
                            },
                        },
                        {
                            path: 'DigitalProductPassport',
                            component: DigitalProductPassportView,
                            data: {
                                type: 'Composition',
                                routes: ['Nameplate', 'CarbonFootprint', 'HandoverDocumentation'],
                            },
                        },
                        {
                            path: 'Nameplate',
                            component: NameplateView,
                            data: {
                                type: 'Leaf',
                                semanticIds: [NAMEPLATE_2_0, NAMEPLATE_FHG, NAMEPLATE_HSU, NAMEPLATE_3_0],
                            },
                        },
                        {
                            path: 'HandoverDocumentation',
                            component: HandoverDocumentationView,
                            data: {
                                type: 'Leaf',
                                semanticIds: [HANDOVER_DOCUMENTATION_2_0, HANDOVER_DOCUMENTATION_1_2],
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
            imports: [DigitalProductPassportView],
        }).compileComponents();

        TestBed.overrideComponent(DigitalProductPassportView, {
            remove: { imports: [ThumbnailQRCode, Nameplate, CarbonFootprint, HandoverDocumentation] },
            add: { imports: [TestThumbnailQRCode, TestNameplate, TestCarbonFootprint, TestHandoverDocumentation] },
        });
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(DigitalProductPassportView);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('mainData', () => {
        const fixture = TestBed.createComponent(DigitalProductPassportView);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.mainData().productType).toEqual('tortoise');
        expect(component.mainData().serialNumber).toEqual('00000001');
        expect(component.mainData().uriOfTheProduct).toEqual('https://smartfactory-owl.de/3dl/__turtle/__00000001');
    });

    it('hazardStatement', () => {
        const fixture = TestBed.createComponent(DigitalProductPassportView);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.hazardStatement()).toEqual('Choking Hazard!');
    });

    it('hazardSymbol', () => {
        const fixture = TestBed.createComponent(DigitalProductPassportView);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.hazardSymbol).toBeTruthy();
    });
});
