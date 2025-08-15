/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { AASDocument } from 'aas-core';

import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { ToolbarService } from '../../../lib/services/toolbar.service';
import { StartService } from '../../../lib/services/start.service';
import { encodeBase64Url } from '../../../lib/utilities';
import { VIEW_ROUTES } from '../../../lib/types';
import { viewRoutes} from '../../../lib/views/views-routes';
import { DigitalProductPassportView } from '../../../lib/views/digital-product-passport/digital-product-passport.view';
import { ThumbnailQRCode } from '../../../lib/views/thumbnail-qrcode/thumbnail-qrcode';

import sample from '../../assets/dpp-sample.json';
import { FakeLoader } from '../../mocks';

@Component({
    selector: 'fhg-thumbnail-qrcode',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestThumbnailQRCode {
    public readonly document = input<AASDocument>();
}

describe('DigitalProductPassportView', () => {
    let api: jasmine.SpyObj<EndpointsApi>;
    let start: jasmine.SpyObj<StartService>;
    let route: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(async () => {
        api = jasmine.createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        start = jasmine.createSpyObj<StartService>(['add', 'save']);
        route = jasmine.createSpyObj<ActivatedRoute>(
            {},
            { params: of({ endpoint: encodeBase64Url(sample.endpoint), id: encodeBase64Url(sample.id) }) },
        );

        api.getDocument.and.returnValue(of(sample as AASDocument));

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
                {
                    provide: VIEW_ROUTES,
                    useValue: viewRoutes,
                },                
                provideZonelessChangeDetection(),
            ],
            imports: [
                DigitalProductPassportView,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        TestBed.overrideComponent(DigitalProductPassportView, {
            remove: { imports: [ThumbnailQRCode] },
            add: { imports: [TestThumbnailQRCode] },
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
