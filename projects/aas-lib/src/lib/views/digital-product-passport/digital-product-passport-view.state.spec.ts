/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { DigitalProductPassportViewState } from './digital-product-passport-view.state';

describe.skip('DigitalProductPassportViewState', () => {
    let service: DigitalProductPassportViewState;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DigitalProductPassportViewState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
