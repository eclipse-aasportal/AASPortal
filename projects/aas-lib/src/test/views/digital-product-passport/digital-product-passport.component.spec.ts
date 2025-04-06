/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location as NgLocation } from '@angular/common';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { DigitalProductPassportComponent } from '../../../lib/views/digital-product-passport/digital-product-passport.component';
import { WINDOW } from '../../../lib/window.service';
import { DocumentsService } from '../../../lib/services/documents.service';
import { AuthService } from '../../../lib/auth/auth.service';
import { SecuredImageComponent } from '../../../lib/secured-image/secured-image.component';

import sample from '../../assets/dpp-sample.json';
import { ToolbarService } from '../../../lib/toolbar.service';
import { StartService } from '../../../lib/start.service';
import { encodeBase64Url } from '../../../lib/utilities';
import { AASDocument } from 'projects/aas-core/dist/types';

@Component({
    selector: 'fhg-img',
    template: '<div></div>',
    styleUrls: [],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestSecuredImageComponent {
    public readonly src = input<string>('');
    public readonly alt = input<string | undefined>();
    public readonly class = input<string | undefined>();
    public readonly width = input<number | undefined>();
    public readonly height = input<number | undefined>();
}

describe('DigitalProductPassportComponent', () => {
    let component: DigitalProductPassportComponent;
    let fixture: ComponentFixture<DigitalProductPassportComponent>;
    let window: jasmine.SpyObj<Window>;
    let api: jasmine.SpyObj<DocumentsService>;
    let auth: jasmine.SpyObj<AuthService>;
    let start: jasmine.SpyObj<StartService>;
    let route: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(async () => {
        api = jasmine.createSpyObj<DocumentsService>(['getDocument', 'getContent']);
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
                    provide: DocumentsService,
                    useValue: api,
                },
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        TestBed.overrideComponent(DigitalProductPassportComponent, {
            remove: { imports: [SecuredImageComponent] },
            add: {
                imports: [TestSecuredImageComponent],
            },
        });

        fixture = TestBed.createComponent(DigitalProductPassportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('mainData', () => {
        expect(component.mainData().productType).toEqual('turtle');
        expect(component.mainData().serialNumber).toEqual('00000001');
        expect(component.mainData().uriOfTheProduct).toEqual('https://smartfactory-owl.de/3dl/__turtle/__00000001');
    });

    it('hazardStatement', () => {
        expect(component.hazardStatement()).toEqual('Choking Hazard!');
    });

    it('thumbnail', () => {
        expect(component.thumbnail()).toBeTruthy();
    });

    it('hazardSymbol', () => {
        expect(component.hazardSymbol).toBeTruthy();
    });

    it('nameplate data', () => {
        expect(component.nameplateItems().length).toEqual(15);
    });

    it('totalPCFCO2eq', () => {
        expect(component.totalPCFCO2eq()).toBeCloseTo(1.23 + 4.56);
    });

    it('carbon footprint items', () => {
        expect(component.carbonFootprintSize()).toEqual(2);
        expect(component.carbonFootprintItems().length).toEqual(4);
        expect(component.carbonFootprintIndex()).toEqual(1);
        expect(component.carbonFootprintItems()[0].value).toEqual('ProductCarbonFootprint_CradleToGate');

        component.carbonFootprintIndex.set(2);
        expect(component.carbonFootprintItems()[0].value).toEqual('ProductCarbonFootprint_CooperativeAssembly');
    });
});
