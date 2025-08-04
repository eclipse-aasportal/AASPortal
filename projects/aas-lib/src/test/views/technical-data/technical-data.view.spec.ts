/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TechnicalDataView } from '../../../lib/views/technical-data/technical-data.view';
import { provideZonelessChangeDetection } from '@angular/core';


xdescribe('TechnicalDataView', () => {
    let component: TechnicalDataView;
    let fixture: ComponentFixture<TechnicalDataView>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [provideZonelessChangeDetection()],
            imports: [TechnicalDataView],
        }).compileComponents();

        fixture = TestBed.createComponent(TechnicalDataView);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
