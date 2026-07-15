/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { StateStore } from './state-store';

describe('StateStore', () => {
    let service: StateStore;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(StateStore);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
