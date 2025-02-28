/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { TemplateRef } from '@angular/core';

import { ToolbarService } from '../../../aas-lib/src/lib/toolbar.service';

describe('ToolbarService', () => {
    let service: ToolbarService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
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
            const template = jasmine.createSpyObj<TemplateRef<unknown>>(['createEmbeddedView']);
            await service.set(template);
            expect(service.toolbarTemplate()).toEqual(template);
        });
    });

    describe('clear', () => {
        beforeEach(() => {
            const template = jasmine.createSpyObj<TemplateRef<unknown>>(['createEmbeddedView']);
            service.set(template);
        });

        it('removes a toolbar', async () => {
            await service.clear();
            expect(service.toolbarTemplate()).toBeNull();
        });
    });
});