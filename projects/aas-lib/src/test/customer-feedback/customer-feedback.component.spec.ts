/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { CustomerFeedbackComponent } from '../../lib/customer-feedback/customer-feedback.component';
import { Location } from '@angular/common';

describe('CustomerFeedbackComponent', () => {
    let component: CustomerFeedbackComponent;
    let fixture: ComponentFixture<CustomerFeedbackComponent>;
    let location: jasmine.SpyObj<Location>;

    beforeEach(() => {
        location = jasmine.createSpyObj<Location>(['getState']);
        location.getState.and.returnValue({});

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

        fixture = TestBed.createComponent(CustomerFeedbackComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
