/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CarbonFootprintView } from '../../../lib/views/carbon-footprint/carbon-footprint.view';

xdescribe('CarbonFootprintView', () => {
    let component: CarbonFootprintView;
    let fixture: ComponentFixture<CarbonFootprintView>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CarbonFootprintView],
            providers: [provideZonelessChangeDetection()],
        }).compileComponents();

        fixture = TestBed.createComponent(CarbonFootprintView);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
