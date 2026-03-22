/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { ProgressService } from '../../../lib/components/progress/progress.service';
import { provideZonelessChangeDetection } from '@angular/core';

describe('ProgressService', () => {
    let service: ProgressService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideZonelessChangeDetection()],
        });
        service = TestBed.inject(ProgressService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});