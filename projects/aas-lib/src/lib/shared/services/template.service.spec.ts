/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, vitest } from 'vitest';
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

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error']),
                },
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(TemplateService);
        template = {
            name: 'submodel-template',
            url: 'http://read/the/template/file.json',
        };
    });

    afterEach(() => {
        vitest.clearAllMocks();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('templates', () => {
        it('returns the available templates', async () => {
            const httpMock: HttpTestingController = TestBed.inject(HttpTestingController);
            TestBed.tick();
            httpMock.expectOne('/assets/published-idta-templates.json').flush([template]);
            await TestBed.inject(ApplicationRef).whenStable();
            expect(service.templates()).toEqual([template.name]);
            httpMock.verify();
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

            const httpMock: HttpTestingController = TestBed.inject(HttpTestingController);
            TestBed.tick();
            httpMock.expectOne('/assets/published-idta-templates.json').flush([template]);
            await TestBed.inject(ApplicationRef).whenStable();

            mockFetchJson(env);

            service.template.set('submodel-template');
            const environment = await service.getTemplate();
            expect(environment).toBeInstanceOf(types.Environment);
        });
    });
});
