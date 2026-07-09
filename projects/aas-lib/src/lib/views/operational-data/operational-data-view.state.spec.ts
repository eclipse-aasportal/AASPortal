/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { OperationalDataViewState } from './operational-data-view.state';

describe.skip('OperationalDataViewState', () => {
    let service: OperationalDataViewState;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(OperationalDataViewState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
