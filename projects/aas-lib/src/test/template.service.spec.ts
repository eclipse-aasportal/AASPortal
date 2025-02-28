/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { of } from 'rxjs';
import { TemplateDescriptor, aas } from 'aas-core';

import { TemplateService } from '../lib/template.service';
import { NotifyService } from '../public-api';

describe('TemplateService', () => {
    let service: TemplateService;
    let httpTestingController: HttpTestingController;
    let http: HttpClient;
    let template: TemplateDescriptor;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                { provide: NotifyService, useValue: jasmine.createSpyObj<NotifyService>(['error']) },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });

        http = TestBed.inject(HttpClient);
        service = TestBed.inject(TemplateService);
        httpTestingController = TestBed.inject(HttpTestingController);

        template = {
            idShort: '',
            modelType: 'Property',
            endpoint: { type: 'file', address: 'property.json' },
        };

        const url = `/api/v1/templates`;
        const req = httpTestingController.expectOne(url);
        req.flush([template] as TemplateDescriptor[]);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('templates', () => {
        it('returns the available templates', () => {
            expect(service.templates()).toEqual([template]);
        });
    });

    describe('getTemplate', () => {
        it('returns the template with the specified endpoint', (done: DoneFn) => {
            const property: aas.Property = {
                valueType: 'xs:string',
                idShort: 'aProperty',
                modelType: 'Property',
            };

            spyOn(http, 'get').and.returnValue(of(property));

            service.getTemplate({ type: 'file', address: 'submodel-element/property.json' }).subscribe(value => {
                expect(value).toEqual(property);
                expect(http.get).toHaveBeenCalledWith(`/api/v1/templates/c3VibW9kZWwtZWxlbWVudC9wcm9wZXJ0eS5qc29u`);
                done();
            });
        });
    });
});