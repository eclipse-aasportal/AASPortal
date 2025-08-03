/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicalData } from '../../../lib/internal';

xdescribe('TechnicalData', () => {
    let component: TechnicalData;
    let fixture: ComponentFixture<TechnicalData>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TechnicalData],
        }).compileComponents();

        fixture = TestBed.createComponent(TechnicalData);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
