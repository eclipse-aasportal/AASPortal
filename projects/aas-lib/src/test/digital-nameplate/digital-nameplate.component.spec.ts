/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { selectElement } from 'aas-core';
import { nameplate } from './digital-nameplate-document';
import { DigitalNameplateComponent } from '../../lib/digital-nameplate/digital-nameplate.component';

describe('DigitalNameplateComponent', () => {
    let component: DigitalNameplateComponent;
    let fixture: ComponentFixture<DigitalNameplateComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
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
        fixture.componentRef.setInput('submodels', [
            { document: nameplate, submodel: selectElement(nameplate.content!, 'Nameplate')! },
        ]);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a "ManufacturerName" property', function () {
        expect(component.nameplates()[0].manufacturerName).toEqual('Muster AG');
    });
});
