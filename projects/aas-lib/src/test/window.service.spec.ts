/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { WindowService } from '../lib/window.service';

describe('WindowService', () => {
    let service: WindowService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(WindowService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});