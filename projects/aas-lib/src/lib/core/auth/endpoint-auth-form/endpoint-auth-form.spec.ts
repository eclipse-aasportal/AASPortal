/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AASEndpoint, EndpointAuth } from 'aas-core';
import { EndpointAuthForm } from './endpoint-auth-form';
import { createSpyObj, FakeLoader } from '../../../../test/mocks';
import { FormError } from '../../../shared/components/form-error/form-error';

describe('EndpointAuthForm', () => {
    let component: EndpointAuthForm;
    let fixture: ComponentFixture<EndpointAuthForm>;
    let activeModal: NgbActiveModal;
    let httpController: HttpTestingController;
    let app: ApplicationRef;
    let endpointSelect: HTMLSelectElement;
    let authSelect: HTMLSelectElement;

    function getInputElement(id: string): HTMLInputElement {
        return fixture.debugElement.nativeElement.querySelector('#' + id);
    }

    beforeEach(async () => {
        activeModal = createSpyObj<NgbActiveModal>(['close', 'dismiss']);
        await TestBed.configureTestingModule({
            providers: [
                { provide: NgbActiveModal, useValue: activeModal },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),

                provideZonelessChangeDetection(),
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
            imports: [EndpointAuthForm, FormError],
        }).compileComponents();

        httpController = TestBed.inject(HttpTestingController);
        app = TestBed.inject(ApplicationRef);
        fixture = TestBed.createComponent(EndpointAuthForm);
        component = fixture.componentInstance;

        app.tick();
        httpController.expectOne('/api/v1/endpoints/auth').flush([
            {
                name: 'Endpoint A',
                headers: {
                    'x-api-key': '',
                },
            },
            {
                name: 'Endpoint B',
                headers: {},
            },
        ] satisfies EndpointAuth[]);

        httpController.expectOne('/api/v1/endpoints').flush([
            {
                name: 'Endpoint A',
                url: 'http://example.com/endpoint',
                type: 'AAS_API',
                version: '3.0',
                headers: {
                    'x-api-key': '*****',
                },
                schedule: {
                    type: 'every',
                    values: [3600000],
                },
            },
            {
                name: 'Endpoint B',
                url: 'opc.tcp://example.com:4840',
                type: 'OPC_UA',
            },
        ] satisfies AASEndpoint[]);

        await fixture.whenStable();

        endpointSelect = fixture.debugElement.nativeElement.querySelector('#AID_SELECT_ENDPOINT');
        authSelect = fixture.debugElement.nativeElement.querySelector('#AID_SELECT_AUTHORIZATION');
    });

    it('should create', () => {
        expect(component).toBeInstanceOf(EndpointAuthForm);
    });

    it('should have two endpoints', () => {
        expect(component.endpoint().value()).toEqual('Endpoint A');
        expect(component.items().value().length).toEqual(2);
        expect(component.index()).toBe(0);
        expect(component.authorizations()).toEqual([
            'EndpointAuthForm.NO_AUTH',
            'EndpointAuthForm.API_KEY',
            'EndpointAuthForm.BEARER_TOKEN',
        ]);

        expect(endpointSelect.value).toBe('Endpoint A');
        expect(authSelect.value).toBe('EndpointAuthForm.API_KEY');
        expect(getInputElement('AID_HEADER_NAME').value).toBe('x-api-key');
        expect(getInputElement('AID_ACCESS_KEY').value).toBe('');
    });

    it('should auth Endpoint B via Bearer token', () => {
        endpointSelect.value = 'Endpoint B';
        endpointSelect.dispatchEvent(new Event('input'));
        endpointSelect.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        expect(component.endpoint().value()).toBe('Endpoint B');
        expect(component.index()).toBe(1);
        expect(component.items[1].authorization().value()).toBe('EndpointAuthForm.NO_AUTH');

        authSelect.value = 'EndpointAuthForm.BEARER_TOKEN';
        authSelect.dispatchEvent(new Event('input'));
        authSelect.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        const tokenInput = getInputElement('AID_BEARER_TOKEN');
        tokenInput.value = 'a-bearer-token';
        tokenInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.items[1].authorization().value()).toBe('EndpointAuthForm.BEARER_TOKEN');
        expect(component.items[1].token().value()).toBe('a-bearer-token');

        component.submit(new Event('click'));
        expect(activeModal.close).toHaveBeenCalledWith([
            {
                name: 'Endpoint B',
                headers: { Authorization: 'Bearer a-bearer-token' },
            },
        ] satisfies EndpointAuth[]);
    });

    it('should auth Endpoint B via API Key', () => {
        endpointSelect.value = 'Endpoint B';
        endpointSelect.dispatchEvent(new Event('input'));
        endpointSelect.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        expect(component.endpoint().value()).toBe('Endpoint B');
        expect(component.index()).toBe(1);
        expect(component.items[1].authorization().value()).toBe('EndpointAuthForm.NO_AUTH');

        authSelect.value = 'EndpointAuthForm.API_KEY';
        authSelect.dispatchEvent(new Event('input'));
        authSelect.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        const keyInput = getInputElement('AID_HEADER_NAME');
        keyInput.value = 'X-API-KEY';
        keyInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        const keyValueInput = getInputElement('AID_ACCESS_KEY');
        keyValueInput.value = 'an-api-key';
        keyValueInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.items[1].authorization().value()).toBe('EndpointAuthForm.API_KEY');
        expect(component.items[1].value().value()).toBe('an-api-key');

        component.submit(new Event('click'));
        expect(activeModal.close).toHaveBeenCalledWith([
            {
                name: 'Endpoint B',
                headers: { 'X-API-KEY': 'an-api-key' },
            },
        ] satisfies EndpointAuth[]);
    });

    it('should remove auth form Endpoint A', () => {
        authSelect.value = 'EndpointAuthForm.NO_AUTH';
        authSelect.dispatchEvent(new Event('input'));
        authSelect.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        component.submit(new Event('click'));
        expect(activeModal.close).toHaveBeenCalledWith([
            {
                name: 'Endpoint A',
                headers: {},
            },
        ] satisfies EndpointAuth[]);
    });
});
