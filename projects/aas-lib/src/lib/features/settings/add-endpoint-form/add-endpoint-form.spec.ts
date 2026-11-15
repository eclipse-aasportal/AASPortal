/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { AASEndpoint } from 'aas-core';

import { AddEndpointForm } from './add-endpoint-form';
import { createSpyObj, FakeLoader } from '../../../../test/mocks';
import { FormError } from '../../../shared/components/form-error/form-error';

describe('AddEndpointForm', () => {
    let component: AddEndpointForm;
    let fixture: ComponentFixture<AddEndpointForm>;
    let activeModal: Mocked<NgbActiveModal>;
    let httpController: HttpTestingController;

    beforeEach(async () => {
        activeModal = createSpyObj<NgbActiveModal>(['close', 'dismiss']);

        await TestBed.configureTestingModule({
            providers: [
                { provide: NgbActiveModal, useValue: activeModal },
                provideTranslateService(),
                provideHttpClientTesting(),
            ],
            imports: [AddEndpointForm, FormError],
        }).compileComponents();

        httpController = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(AddEndpointForm);
        component = fixture.componentInstance;

        TestBed.tick();
        httpController.expectOne('/api/v1/endpoints').flush([
            {
                name: 'Endpoint B',
                url: 'opc.tcp://example.com:4840',
                type: 'OPC_UA',
            },
            {
                name: 'Endpoint A',
                url: 'http://example.com/endpoint/',
                type: 'AAS_API',
                version: '3.0',
            },
        ] satisfies AASEndpoint[]);

        fixture.detectChanges();
        httpController.verify();
        await TestBed.inject(ApplicationRef).whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should disable submission for invalid values', () => {
        component.form.name().value.set('Endpoint A');
        component.form.url().value.set('http://example.com/endpoint/');
        fixture.detectChanges();

        expect(component.form().invalid()).toBe(true);
        expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);

        component.form.name().value.set('New Endpoint');
        component.form.url().value.set('invalid-url');
        fixture.detectChanges();

        expect(component.form().invalid()).toBe(true);

        component.form.url().value.set('http://example.com/endpoint/');
        component.form.hours().value.set(1000);
        component.form.minutes().value.set(60);
        fixture.detectChanges();

        expect(component.form.hours().invalid()).toBe(true);
        expect(component.form.minutes().invalid()).toBe(true);
        expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
    });

    it('should require credentials for the selected authorization type', () => {
        component.form.name().value.set('New Endpoint');
        component.form.url().value.set('http://example.com/endpoint/');
        component.form.authorization().value.set('AddEndpointForm.API_KEY');
        fixture.detectChanges();

        expect(component.form.key().invalid()).toBe(true);
        expect(component.form.value().invalid()).toBe(true);
        expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);

        component.form.authorization().value.set('AddEndpointForm.BEARER_TOKEN');
        fixture.detectChanges();

        expect(component.form.token().invalid()).toBe(true);
        expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
    });

    it('should hide authorization controls for non-AAS API endpoints', () => {
        component.selectTemplate('OPC_UA');
        fixture.detectChanges();

        expect(component.placeholder()).toBe('AddEndpointForm.PLACEHOLDER_URL_OPCUA');
        expect(fixture.nativeElement.querySelector('#AID_SELECT_AUTHORIZATION')).toBeNull();
    });

    it('should input a new endpoint with API key', () => {
        const inputName: HTMLInputElement = fixture.debugElement.nativeElement.querySelector('#AID_ENDPOINT_NAME');
        inputName.value = 'New Endpoint';
        inputName.dispatchEvent(new Event('input'));

        component.selectTemplate('AAS_API');

        const inputUrl: HTMLInputElement = fixture.debugElement.nativeElement.querySelector('#AID_ENDPOINT_URL');
        inputUrl.value = 'http://example.com/new-endpoint/?version=v3.1&ignored=value';
        inputUrl.dispatchEvent(new Event('input'));
        const select: HTMLSelectElement = fixture.debugElement.nativeElement.querySelector('#AID_SELECT_SCHEDULE');
        select.value = 'every';
        select.dispatchEvent(new Event('input'));
        select.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        const inputHours: HTMLInputElement = fixture.debugElement.nativeElement.querySelector('#AID_SCHEDULE_HOURS');
        inputHours.value = '1';
        inputHours.dispatchEvent(new Event('input'));
        const inputMinutes: HTMLInputElement =
            fixture.debugElement.nativeElement.querySelector('#AID_SCHEDULE_MINUTES');
        inputMinutes.value = '30';
        inputMinutes.dispatchEvent(new Event('input'));

        const selectAuth: HTMLSelectElement =
            fixture.debugElement.nativeElement.querySelector('#AID_SELECT_AUTHORIZATION');
        selectAuth.value = 'AddEndpointForm.API_KEY';
        selectAuth.dispatchEvent(new Event('input'));
        selectAuth.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        const keyInput: HTMLInputElement = fixture.debugElement.nativeElement.querySelector('#AID_HEADER_NAME');
        keyInput.value = 'X-API-KEY';
        keyInput.dispatchEvent(new Event('input'));
        const valueInput: HTMLInputElement = fixture.debugElement.nativeElement.querySelector('#AID_ACCESS_KEY');
        valueInput.value = 'an-api-key';
        valueInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.form.name().value()).toBe('New Endpoint');
        expect(component.form.url().value()).toBe('http://example.com/new-endpoint/?version=v3.1&ignored=value');
        expect(component.form.type().value()).toBe('AAS_API');
        expect(component.form.schedule().value()).toBe('every');
        expect(component.form.hours().value()).toBe(1);
        expect(component.form.minutes().value()).toBe(30);
        expect(component.form.authorization().value()).toBe('AddEndpointForm.API_KEY');
        expect(component.form.key().value()).toBe('X-API-KEY');
        expect(component.form.value().value()).toBe('an-api-key');

        const form: HTMLFormElement = fixture.debugElement.nativeElement.querySelector('form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        expect(activeModal.close).toHaveBeenCalledWith({
            name: 'New Endpoint',
            type: 'AAS_API',
            version: 'v3.1',
            url: 'http://example.com/new-endpoint/',
            schedule: { type: 'every', values: [5400000] },
            headers: { 'X-API-KEY': 'an-api-key' },
        } satisfies AASEndpoint);
    });

    it('should input a new endpoint with Bearer token', () => {
        const inputName: HTMLInputElement = fixture.debugElement.nativeElement.querySelector('#AID_ENDPOINT_NAME');
        inputName.value = 'New Endpoint';
        inputName.dispatchEvent(new Event('input'));

        component.selectTemplate('AAS_API');

        const inputUrl: HTMLInputElement = fixture.debugElement.nativeElement.querySelector('#AID_ENDPOINT_URL');
        inputUrl.value = 'http://example.com/new-endpoint/';
        inputUrl.dispatchEvent(new Event('input'));
        const select: HTMLSelectElement = fixture.debugElement.nativeElement.querySelector('#AID_SELECT_SCHEDULE');
        select.value = 'manual';
        select.dispatchEvent(new Event('input'));
        select.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        const selectAuth: HTMLSelectElement =
            fixture.debugElement.nativeElement.querySelector('#AID_SELECT_AUTHORIZATION');
        selectAuth.value = 'AddEndpointForm.BEARER_TOKEN';
        selectAuth.dispatchEvent(new Event('input'));
        selectAuth.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        const tokenInput: HTMLInputElement = fixture.debugElement.nativeElement.querySelector('#AID_BEARER_TOKEN');
        tokenInput.value = 'a-bearer-token';
        tokenInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.form.name().value()).toBe('New Endpoint');
        expect(component.form.url().value()).toBe('http://example.com/new-endpoint/');
        expect(component.form.type().value()).toBe('AAS_API');
        expect(component.form.schedule().value()).toBe('manual');
        expect(component.form.authorization().value()).toBe('AddEndpointForm.BEARER_TOKEN');
        expect(component.form.token().value()).toBe('a-bearer-token');

        const form: HTMLFormElement = fixture.debugElement.nativeElement.querySelector('form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        expect(activeModal.close).toHaveBeenCalledWith({
            name: 'New Endpoint',
            type: 'AAS_API',
            version: 'v3',
            url: 'http://example.com/new-endpoint/',
            schedule: { type: 'manual' },
            headers: { Authorization: 'Bearer a-bearer-token' },
        } satisfies AASEndpoint);
    });

    it('should dismiss the modal when cancelled', () => {
        component.cancel();

        expect(activeModal.dismiss).toHaveBeenCalledOnce();
    });
});
