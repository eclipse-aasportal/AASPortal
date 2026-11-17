/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { CustomerFeedbackCardComponent } from './customer-feedback-card.component';

describe('CustomerFeedbackCardComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [provideTranslateService()],
            imports: [CustomerFeedbackCardComponent],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(CustomerFeedbackCardComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
