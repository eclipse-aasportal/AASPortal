/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, TemplateRef } from '@angular/core';
import { ToolbarService } from './toolbar.service';
import { createSpyObj } from '../../test/mocks';

describe('ToolbarService', () => {
    let service: ToolbarService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
        service = TestBed.inject(ToolbarService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('set', () => {
        beforeEach(() => {
            service.clear();
        });

        it('sets a new toolbar', async () => {
            const template = createSpyObj<TemplateRef<unknown>>(['createEmbeddedView']);
            await service.set(template);
            expect(service.toolbarTemplate()).toEqual(template);
        });
    });

    describe('clear', () => {
        beforeEach(() => {
            const template = createSpyObj<TemplateRef<unknown>>(['createEmbeddedView']);
            service.set(template);
        });

        it('removes a toolbar', async () => {
            await service.clear();
            expect(service.toolbarTemplate()).toBeNull();
        });
    });
});
