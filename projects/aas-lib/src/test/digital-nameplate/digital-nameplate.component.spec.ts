/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { SimpleChange } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { selectElement } from 'common';
import { nameplate } from './digital-nameplate-document';
import { DigitalNameplateComponent } from '../../lib/digital-nameplate/digital-nameplate.component';

describe('DigitalNameplateComponent', () => {
    let component: DigitalNameplateComponent;
    let fixture: ComponentFixture<DigitalNameplateComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                DigitalNameplateComponent
            ],
            providers: [],
            imports: [
                CommonModule,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        fixture = TestBed.createComponent(DigitalNameplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        component.submodels = [{ document: nameplate, submodel: selectElement(nameplate.content!, 'Nameplate')! }];
        component.ngOnChanges({ 'submodels': new SimpleChange(null, component.submodels, true) });
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a "ManufacturerName" property', function () {
        expect(component.nameplates[0].manufacturerName).toEqual('Muster AG');
    });
});