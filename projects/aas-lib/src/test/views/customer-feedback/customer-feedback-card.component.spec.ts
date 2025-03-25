/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerFeedbackCardComponent } from '../../../lib/views/customer-feedback/customer-feedback-card.component';

describe('CustomerFeedbackCardComponent', () => {
    let component: CustomerFeedbackCardComponent;
    let fixture: ComponentFixture<CustomerFeedbackCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
        }).compileComponents();

        fixture = TestBed.createComponent(CustomerFeedbackCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
