/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Location } from '@angular/common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { CustomerFeedbackComponent } from '../../lib/customer-feedback/customer-feedback.component';
import { ToolbarService } from '../../lib/toolbar.service';
import { StartService } from '../../lib/start.service';

describe('CustomerFeedbackComponent', () => {
    let component: CustomerFeedbackComponent;
    let fixture: ComponentFixture<CustomerFeedbackComponent>;
    let location: jasmine.SpyObj<Location>;
    let start: jasmine.SpyObj<StartService>;

    beforeEach(() => {
        location = jasmine.createSpyObj<Location>(['getState']);
        location.getState.and.returnValue({});
        start = jasmine.createSpyObj<StartService>(['add', 'save']);

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: Location,
                    useValue: location,
                },
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) }),
                },
                {
                    provide: StartService,
                    useValue: start,
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
