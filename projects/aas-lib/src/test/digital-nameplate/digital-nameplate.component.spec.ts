/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { nameplate } from './digital-nameplate-document';
import { DigitalNameplateComponent } from '../../lib/digital-nameplate/digital-nameplate.component';
import { Location } from '@angular/common';

describe('DigitalNameplateComponent', () => {
    let component: DigitalNameplateComponent;
    let fixture: ComponentFixture<DigitalNameplateComponent>;
    let location: jasmine.SpyObj<Location>;

    beforeEach(() => {
        location = jasmine.createSpyObj<Location>(['getState']);
        location.getState.and.returnValue({ data: JSON.stringify([nameplate]) });

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: Location,
                    useValue: location,
                },
            ],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        fixture = TestBed.createComponent(DigitalNameplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a "ManufacturerName" property', function () {
        expect(component.nameplates()[0].manufacturerName).toEqual('Muster AG');
    });
});
