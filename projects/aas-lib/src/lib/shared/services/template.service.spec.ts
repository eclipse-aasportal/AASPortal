/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { aas, TemplateDescriptor, types } from 'aas-core';

import { NotifyService } from '../../core/notify/notify.service';
import { TemplateService } from '../../shared/services/template.service';
import { createSpyObj, mockFetchJson, restoreFetch } from '../../../test/mocks';

describe('TemplateService', () => {
    let service: TemplateService;
    let template: TemplateDescriptor;
    let httpController: HttpTestingController;

    beforeEach(async () => {
        template = {
            name: 'submodel-template',
            url: 'http://read/the/template/file.json',
        };

        TestBed.configureTestingModule({
            providers: [
                TemplateService,
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error']),
                },
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(TemplateService);

        httpController = TestBed.inject(HttpTestingController);
        TestBed.tick();
        httpController.expectOne('/assets/published-idta-templates.json').flush([template]);
        await TestBed.inject(ApplicationRef).whenStable();
    });

    afterEach(() => {
        vi.clearAllMocks();
        httpController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('templates', () => {
        it('returns the available templates', () => {
            expect(service.templates()).toEqual([template.name]);
        });
    });

    describe('getTemplate', () => {
        afterEach(() => {
            restoreFetch();
        });

        it('returns the template with the specified endpoint', async () => {
            const env: aas.Environment = {
                assetAdministrationShells: [],
                conceptDescriptions: [],
                submodels: [
                    {
                        id: 'http://localhost/aas/submodel',
                        idShort: 'Submodel',
                        modelType: 'Submodel',
                    },
                ],
            };

            mockFetchJson(env);

            service.template.set('submodel-template');
            const environment = await service.getTemplate();
            expect(environment).toBeInstanceOf(types.Environment);
        });
    });
});
