/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CustomerFeedbackViewState } from '../../../lib/views/customer-feedback/customer-feedback-view.state';

describe.skip('CustomerFeedbackViewState', () => {
    let service: CustomerFeedbackViewState;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideZonelessChangeDetection()],
        });
        service = TestBed.inject(CustomerFeedbackViewState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});