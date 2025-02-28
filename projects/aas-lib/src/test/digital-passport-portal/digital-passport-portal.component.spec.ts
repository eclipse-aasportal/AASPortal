/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location as NgLocation } from '@angular/common';
import { provideRouter } from '@angular/router';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DigitalPassportPortalComponent } from '../../lib/digital-passport-portal/digital-passport-portal.component';
import { WINDOW } from '../../lib/window.service';
import { DigitalPassportPortalService } from '../../lib/digital-passport-portal/digital-passport-portal.service';
import { AuthService } from '../../lib/auth/auth.service';
import { SecuredImageComponent } from '../../lib/secured-image/secured-image.component';

import sample from '../assets/dpp-portal-sample.json';

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

describe('DigitalPassportPortalComponent', () => {
    let component: DigitalPassportPortalComponent;
    let fixture: ComponentFixture<DigitalPassportPortalComponent>;
    let location: jasmine.SpyObj<NgLocation>;
    let window: jasmine.SpyObj<Window>;
    let api: jasmine.SpyObj<DigitalPassportPortalService>;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(async () => {
        location = jasmine.createSpyObj<NgLocation>(['getState']);
        location.getState.and.returnValue({ data: JSON.stringify([sample]) });
        api = jasmine.createSpyObj<DigitalPassportPortalService>(['getDocument', 'getContent']);
        auth = jasmine.createSpyObj<AuthService>({}, { token: signal<string | undefined>('Token').asReadonly() });
        window = jasmine.createSpyObj<Window>(['open'], {
            location: { toString: () => 'https://www.fraunhofer.de' } as Location,
        });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: NgLocation,
                    useValue: location,
                },
                {
                    provide: WINDOW,
                    useValue: window,
                },
                {
                    provide: AuthService,
                    useValue: auth,
                },
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
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

        TestBed.overrideComponent(DigitalPassportPortalComponent, {
            remove: { providers: [DigitalPassportPortalService], imports: [SecuredImageComponent] },
            add: {
                providers: [{ provide: DigitalPassportPortalService, useValue: api }],
                imports: [TestSecuredImageComponent],
            },
        });

        fixture = TestBed.createComponent(DigitalPassportPortalComponent);
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

    it ('nameplate data', () => {
        expect(component.nameplateItems().length).toEqual(15);
    });

    it('totalPCFCO2eq', () => {
        expect(component.totalPCFCO2eq()).toBeCloseTo(1.23 + 4.56);
    });

    it ('carbon footprint items', () => {
        expect(component.carbonFootprintSize()).toEqual(2);
        expect(component.carbonFootprintItems().length).toEqual(6);
        expect(component.carbonFootprintIndex()).toEqual(1);
        expect(component.carbonFootprintItems()[0].value).toEqual('ProductCarbonFootprint_CradleToGate');
        
        component.carbonFootprintIndex.set(2);
        expect(component.carbonFootprintItems()[0].value).toEqual('ProductCarbonFootprint_CooperativeAssembly');
    });
});