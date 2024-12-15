/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DigitalPassportPortalComponent } from '../../lib/digital-passport-portal/digital-passport-portal.component';
import { provideHttpClient } from '@angular/common/http';

describe('DigitalPassportPortalComponent', () => {
    let component: DigitalPassportPortalComponent;
    let fixture: ComponentFixture<DigitalPassportPortalComponent>;
    let location: jasmine.SpyObj<Location>;

    beforeEach(async () => {
        location = jasmine.createSpyObj<Location>(['getState']);
        location.getState.and.returnValue({});

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: Location,
                    useValue: location,
                },
                provideRouter([]),
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

        fixture = TestBed.createComponent(DigitalPassportPortalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});