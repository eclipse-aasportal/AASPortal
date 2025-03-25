/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCardComponent } from '../../app/dashboard/dashboard-card.component';

describe('DashboardCardComponent', () => {
    let component: DashboardCardComponent;
    let fixture: ComponentFixture<DashboardCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});