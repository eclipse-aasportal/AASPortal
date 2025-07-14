/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AASDocument } from 'aas-core';

import { DigitalProductPassportComponent } from '../../../lib/views/digital-product-passport/digital-product-passport.component';
import { WINDOW } from '../../../lib/services/window.service';
import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { AuthService } from '../../../lib/components/auth/auth.service';
import { SecuredImageComponent } from '../../../lib/components/secured-image/secured-image.component';
import { ToolbarService } from '../../../lib/services/toolbar.service';
import { StartService } from '../../../lib/services/start.service';
import { encodeBase64Url } from '../../../lib/utilities';
import { ThumbnailQRCode } from 'projects/aas-lib/src/lib/views/thumbnail-qrcode/thumbnail-qrcode';

import sample from '../../assets/dpp-sample.json';

@Component({
    selector: 'fhg-img',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestSecuredImageComponent {
    public readonly src = input<string>('');
    public readonly alt = input<string | undefined>();
    public readonly class = input<string | undefined>();
    public readonly width = input<number | undefined>();
    public readonly height = input<number | undefined>();
}

@Component({
    selector: 'fhg-thumbnail-qrcode',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestThumbnailQRCode {
    public readonly document = input<AASDocument>();
}

xdescribe('DigitalProductPassportComponent', () => {
    let window: jasmine.SpyObj<Window>;
    let api: jasmine.SpyObj<EndpointsApi>;
    let auth: jasmine.SpyObj<AuthService>;
    let start: jasmine.SpyObj<StartService>;
    let route: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(async () => {
        api = jasmine.createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        auth = jasmine.createSpyObj<AuthService>({}, { token: signal<string | undefined>('Token').asReadonly() });
        start = jasmine.createSpyObj<StartService>(['add', 'save']);
        window = jasmine.createSpyObj<Window>(['open'], {
            location: { toString: () => 'https://www.fraunhofer.de' } as Location,
        });

        route = jasmine.createSpyObj<ActivatedRoute>(
            {},
            { queryParams: of({ endpoint: encodeBase64Url(sample.endpoint), id: encodeBase64Url(sample.id) }) },
        );

        api.getDocument.and.returnValue(of(sample as AASDocument));

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: route,
                },
                {
                    provide: WINDOW,
                    useValue: window,
                },
                {
                    provide: AuthService,
                    useValue: auth,
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
                provideHttpClient(),
                provideHttpClientTesting(),
                provideZonelessChangeDetection(),
            ],
            imports: [
                DigitalProductPassportComponent,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        TestBed.overrideComponent(DigitalProductPassportComponent, {
            remove: { imports: [SecuredImageComponent, ThumbnailQRCode] },
            add: { imports: [TestSecuredImageComponent, TestThumbnailQRCode] },
        });
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(DigitalProductPassportComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('mainData', () => {
        const fixture = TestBed.createComponent(DigitalProductPassportComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.mainData().productType).toEqual('turtle');
        expect(component.mainData().serialNumber).toEqual('00000001');
        expect(component.mainData().uriOfTheProduct).toEqual('https://smartfactory-owl.de/3dl/__turtle/__00000001');
    });

    it('hazardStatement', () => {
        const fixture = TestBed.createComponent(DigitalProductPassportComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.hazardStatement()).toEqual('Choking Hazard!');
    });

    it('hazardSymbol', () => {
        const fixture = TestBed.createComponent(DigitalProductPassportComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.hazardSymbol).toBeTruthy();
    });

    it('nameplate data', () => {
        const fixture = TestBed.createComponent(DigitalProductPassportComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.nameplateItems().length).toEqual(15);
    });
});
