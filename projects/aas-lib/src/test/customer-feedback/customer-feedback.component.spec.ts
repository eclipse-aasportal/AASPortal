/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { CustomerFeedbackComponent } from '../../lib/customer-feedback/customer-feedback.component';
import { customerFeedbackReducer } from '../../lib/customer-feedback/customer-feedback.reducer';

describe('CustomerFeedbackComponent', () => {
    let component: CustomerFeedbackComponent;
    let fixture: ComponentFixture<CustomerFeedbackComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                CustomerFeedbackComponent
            ],
            providers: [],
            imports: [
                CommonModule,
                StoreModule.forRoot({
                    customerFeedback: customerFeedbackReducer
                }),
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        fixture = TestBed.createComponent(CustomerFeedbackComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});