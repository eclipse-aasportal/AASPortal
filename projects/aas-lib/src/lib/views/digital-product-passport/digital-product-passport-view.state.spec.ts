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

import { DigitalProductPassportViewState } from './digital-product-passport-view.state';
import { NameplateState } from '../nameplate/nameplate.state';
import { CarbonFootprintState } from '../carbon-footprint/carbon-footprint.state';
import { HandoverDocumentationState } from '../handover-documentation/handover-documentation.state';

describe('DigitalProductPassportViewState', () => {
    let service: DigitalProductPassportViewState;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideTranslateService()],
        });
        service = TestBed.inject(DigitalProductPassportViewState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should start with no tuples', () => {
        expect(service.tuples()).toEqual([]);
    });

    it('should provide the states for its child components', () => {
        expect(service.nameplateState).toBeInstanceOf(NameplateState);
        expect(service.carbonFootprintState).toBeInstanceOf(CarbonFootprintState);
        expect(service.handoverDocumentationState).toBeInstanceOf(HandoverDocumentationState);
    });
});
