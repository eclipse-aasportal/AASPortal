/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { canActivateAASGuard } from '../app/aas/can-activate-aas.guard';

describe('canActivateAASGuard', () => {
    const executeGuard: CanActivateFn = (...guardParameters) =>
        TestBed.runInInjectionContext(() => canActivateAASGuard(...guardParameters));

    beforeEach(() => {
        TestBed.configureTestingModule({});
    });

    it('should be created', () => {
        expect(executeGuard).toBeTruthy();
    });
});
