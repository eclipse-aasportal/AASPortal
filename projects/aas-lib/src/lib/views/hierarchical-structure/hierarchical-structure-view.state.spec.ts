/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { HierarchicalStructureViewState } from './hierarchical-structure-view.state';

describe('HierarchicalStructureViewState', () => {
    let service: HierarchicalStructureViewState;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideZonelessChangeDetection()],
        });
        service = TestBed.inject(HierarchicalStructureViewState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
