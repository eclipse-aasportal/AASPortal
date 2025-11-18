/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';

import { HierarchicalStructureState } from '../../../lib/views/hierarchical-structure/hierarchical-structure.state';
import { provideZonelessChangeDetection } from '@angular/core';

describe('HierarchicalStructureState', () => {
    let service: HierarchicalStructureState;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [HierarchicalStructureState, provideZonelessChangeDetection()],
        });
        service = TestBed.inject(HierarchicalStructureState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
