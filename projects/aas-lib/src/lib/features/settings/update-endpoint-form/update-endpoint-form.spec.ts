/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { provideTranslateService } from '@ngx-translate/core';
import { UpdateEndpointForm, UpdateEndpointResult } from './update-endpoint-form';
import { AASEndpoint } from 'aas-core';

import { createSpyObj } from '../../../../test/mocks';
import { FormError } from '../../../shared/components/form-error/form-error';
import { PromptDialog } from '../../../core/prompt-dialog/prompt-dialog';
import { EndpointsApi } from '../../../shared/services/endpoints-api';
import { NotifyService } from '../../../core/notify/notify.service';
import { of, throwError } from 'rxjs';

describe('UpdateEndpointForm', () => {
    let fixture: ComponentFixture<UpdateEndpointForm>;
    let component: UpdateEndpointForm;
    let activeModal: Mocked<NgbActiveModal>;
    let modal: Mocked<NgbModal>;
    let api: Mocked<EndpointsApi>;
    let notify: Mocked<NotifyService>;
    let httpController: HttpTestingController;

    beforeEach(async () => {
        activeModal = createSpyObj<NgbActiveModal>(['close', 'dismiss']);
        modal = createSpyObj<NgbModal>(['open']);
        api = createSpyObj<EndpointsApi>(['deleteEndpoint']);
        notify = createSpyObj<NotifyService>(['info', 'error']);

        api.deleteEndpoint.mockReturnValue(of(void 0));

        await TestBed.configureTestingModule({
            providers: [
                { provide: NgbActiveModal, useValue: activeModal },
                { provide: NgbModal, useValue: modal },
                { provide: EndpointsApi, useValue: api },
                { provide: NotifyService, useValue: notify },
                provideTranslateService(),
                provideHttpClientTesting(),
            ],
            imports: [UpdateEndpointForm, FormError],
        }).compileComponents();

        httpController = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(UpdateEndpointForm);
        component = fixture.componentInstance;

        TestBed.tick();
        httpController.expectOne('/api/v1/endpoints').flush([
            {
                name: 'Endpoint A',
                url: 'http://example.com/endpoint/',
                type: 'AAS_API',
                version: 'v3',
                headers: {
                    'x-api-key': 'api-key-value',
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

        fixture.detectChanges();
        httpController.verify();
        await TestBed.inject(ApplicationRef).whenStable();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetAllMocks();
        vi.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeInstanceOf(UpdateEndpointForm);
    });

    it('provides two endpoints', () => {
        expect(component.items().length).toBe(2);
    });

    it('shows Endpoint A', () => {
        expect(component.index()).toBe(0);
        const item = component.form.items[0];
        expect(component.form.endpoint().value()).toBe('Endpoint A');
        expect(item.url().value()).toBe('http://example.com/endpoint/');
        expect(item.authorization().value()).toBe('UpdateEndpointForm.API_KEY');
        expect(item.type().value()).toBe('AAS_API');
    });

    it('binds authorization options to their values', () => {
        const select = fixture.nativeElement.querySelector('#AID_SELECT_AUTHORIZATION') as HTMLSelectElement;

        expect(Array.from(select.options, option => option.value)).toEqual(component.authorizations());

        select.value = 'UpdateEndpointForm.BEARER_TOKEN';
        select.dispatchEvent(new Event('input'));
        select.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        expect(component.form.items[0].authorization().value()).toBe('UpdateEndpointForm.BEARER_TOKEN');
        expect(fixture.nativeElement.querySelector('#AID_BEARER_TOKEN')).not.toBeNull();
    });

    it('should change to Endpoint B', () => {
        component.form.endpoint().value.set('Endpoint B');
        expect(component.form.endpoint().value()).toBe('Endpoint B');

        const index = component.index();
        expect(index).toBe(1);
        const item = component.form.items[index];
        expect(item.authorization().value()).toBe('UpdateEndpointForm.NO_AUTH');
        expect(item.type().value()).toBe('OPC_UA');
        expect(item.url().value()).toBe('opc.tcp://example.com:4840');
    });

    it('does not call the API when endpoint deletion is cancelled', async () => {
        vi.spyOn(PromptDialog, 'confirm').mockResolvedValue(undefined);

        await component.deleteEndpoint();

        expect(api.deleteEndpoint).not.toHaveBeenCalled();
        expect(notify.info).not.toHaveBeenCalled();
    });

    it('should delete Endpoint A', async () => {
        vi.spyOn(PromptDialog, 'confirm').mockResolvedValue('Endpoint A');

        const deletePromise = component.deleteEndpoint();
        expect(PromptDialog.confirm).toHaveBeenCalled();
        await deletePromise;

        expect(api.deleteEndpoint).toHaveBeenCalledWith('Endpoint A');
        expect(notify.info).toHaveBeenCalledWith('Settings.AAS_ENDPOINT_DELETED', { endpoint: 'Endpoint A' });

        TestBed.tick();
        httpController.expectOne('/api/v1/endpoints').flush([
            {
                name: 'Endpoint B',
                url: 'opc.tcp://example.com:4840',
                type: 'OPC_UA',
            },
        ] satisfies AASEndpoint[]);

        await TestBed.inject(ApplicationRef).whenStable();

        expect(component.form.items.length).toBe(1);
        expect(component.form.endpoint().value()).toBe('Endpoint B');
        expect(component.index()).toBe(0);

        component.submit(new Event('submit'));
        expect(activeModal.close).toHaveBeenCalledWith({
            delete: [],
            update: [],
        } satisfies UpdateEndpointResult);
    });

    it('reports endpoint deletion errors and clears the deleting state', async () => {
        const error = new Error('Deletion failed');
        api.deleteEndpoint.mockReturnValue(throwError(() => error));
        vi.spyOn(PromptDialog, 'confirm').mockResolvedValue('Endpoint A');

        await component.deleteEndpoint();

        expect(api.deleteEndpoint).toHaveBeenCalledWith('Endpoint A');
        expect(notify.error).toHaveBeenCalledWith(error);
        expect(component.deleting()).toBeUndefined();
    });

    it('should update Endpoint A', async () => {
        const item = component.form.items[0];
        item.url().value.set('http://example.com/endpoint-updated/');
        item.value().value.set('a-new-api-key-value');
        component.submit(new Event('submit'));
        expect(activeModal.close).toHaveBeenCalledWith({
            delete: [],
            update: [
                {
                    name: 'Endpoint A',
                    url: 'http://example.com/endpoint-updated/',
                    type: 'AAS_API',
                    version: 'v3',
                    headers: {
                        'x-api-key': 'a-new-api-key-value',
                    },
                    schedule: {
                        type: 'every',
                        values: [3600000],
                    },
                },
            ] satisfies UpdateEndpointResult['update'],
        } satisfies UpdateEndpointResult);
    });

    it('does not include an unchanged endpoint in the update result', () => {
        component.submit(new Event('submit'));

        expect(activeModal.close).toHaveBeenCalledWith({
            delete: [],
            update: [],
        } satisfies UpdateEndpointResult);
    });

    it('includes URL version changes and removes query parameters from the endpoint URL', () => {
        const item = component.form.items[0];
        item.url().value.set('http://example.com/endpoint/?version=v3.1&ignored=value');
        item.value().value.set('a-new-api-key-value');

        component.submit(new Event('submit'));

        expect(activeModal.close).toHaveBeenCalledWith({
            delete: [],
            update: [
                {
                    name: 'Endpoint A',
                    url: 'http://example.com/endpoint/',
                    type: 'AAS_API',
                    version: 'v3.1',
                    headers: {
                        'x-api-key': 'a-new-api-key-value',
                    },
                    schedule: {
                        type: 'every',
                        values: [3600000],
                    },
                },
            ] satisfies UpdateEndpointResult['update'],
        } satisfies UpdateEndpointResult);
    });

    it.each(['disabled', 'manual', 'once'] as const)('writes a %s schedule', schedule => {
        const item = component.form.items[0];
        item.schedule().value.set(schedule);
        item.value().value.set('a-new-api-key-value');
        component.submit(new Event('submit'));

        expect(activeModal.close).toHaveBeenCalledWith({
            delete: [],
            update: [
                {
                    name: 'Endpoint A',
                    url: 'http://example.com/endpoint/',
                    type: 'AAS_API',
                    version: 'v3',
                    headers: {
                        'x-api-key': 'a-new-api-key-value',
                    },
                    schedule: { type: schedule },
                },
            ] satisfies UpdateEndpointResult['update'],
        } satisfies UpdateEndpointResult);
    });

    it('uses the bearer token when submitting a bearer-authenticated endpoint', () => {
        const item = component.form.items[0];
        item.authorization().value.set('UpdateEndpointForm.BEARER_TOKEN');
        item.token().value.set('a-bearer-token');

        component.submit(new Event('submit'));

        expect(activeModal.close).toHaveBeenCalledWith({
            delete: [],
            update: [
                {
                    name: 'Endpoint A',
                    url: 'http://example.com/endpoint/',
                    type: 'AAS_API',
                    version: 'v3',
                    headers: {
                        Authorization: 'Bearer a-bearer-token',
                    },
                    schedule: {
                        type: 'every',
                        values: [3600000],
                    },
                },
            ] satisfies UpdateEndpointResult['update'],
        } satisfies UpdateEndpointResult);
    });

    it('allows submission when required API key credentials are supplied', () => {
        expect(component.canClose()).toBe(false);

        component.form.items[0].value().value.set('a-new-api-key-value');
        fixture.detectChanges();

        expect(component.canClose()).toBe(true);
    });

    it('dismisses the modal when cancel is clicked', () => {
        const button = fixture.nativeElement.querySelector('.modal-footer .btn-outline-secondary') as HTMLButtonElement;

        button.click();

        expect(activeModal.dismiss).toHaveBeenCalled();
    });
});
