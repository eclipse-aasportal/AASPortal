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

import { AASState } from './aas.state';

describe('AASState', () => {
    let service: AASState;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [AASState, provideTranslateService()],
        });

        service = TestBed.inject(AASState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('provides the current active document', () => {
        expect(service.document()).toBeNull();
    });
});
