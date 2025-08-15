/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { AASState } from '../../app/aas/aas.state';

describe('AASState', () => {
    let service: AASState;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideZonelessChangeDetection()],
        });

        service = TestBed.inject(AASState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('provides the current active document', () => {
        expect(service.document()).toBeNull();
    });

    it('provides the current live state', () => {
        expect(service.live()).toEqual('offline');
    });

    it('provides the current search expression', () => {
        expect(service.searchExpression()).toEqual('');
    });

    it('provides a list of the current selected elements', () => {
        expect(service.selectedElements()).toEqual([]);
    });
});
