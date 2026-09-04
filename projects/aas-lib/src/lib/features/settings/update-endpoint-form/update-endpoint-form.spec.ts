/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { UpdateEndpointForm, UpdateEndpointResult } from './update-endpoint-form';
import { AASEndpoint } from 'aas-core';

import { createSpyObj, FakeLoader } from '../../../../test/mocks';
import { FormError } from '../../../shared/components/form-error/form-error';
import { PromptDialog } from '../../../core/prompt-dialog/prompt-dialog';

describe('UpdateEndpointForm', () => {
    let fixture: ComponentFixture<UpdateEndpointForm>;
    let component: UpdateEndpointForm;
    let activeModal: Mocked<NgbActiveModal>;
    let modal: Mocked<NgbModal>;
    let httpController: HttpTestingController;
    let app: ApplicationRef;

    beforeEach(async () => {
        activeModal = createSpyObj<NgbActiveModal>(['close', 'dismiss']);
        modal = createSpyObj<NgbModal>(['open']);

        await TestBed.configureTestingModule({
            providers: [
                { provide: NgbActiveModal, useValue: activeModal },
                { provide: NgbModal, useValue: modal },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
            ],
            imports: [UpdateEndpointForm, FormError],
        }).compileComponents();

        httpController = TestBed.inject(HttpTestingController);
        app = TestBed.inject(ApplicationRef);
        fixture = TestBed.createComponent(UpdateEndpointForm);
        component = fixture.componentInstance;

        app.tick();
        httpController.expectOne('/api/v1/endpoints').flush([
            {
                name: 'Endpoint A',
                url: 'http://example.com/endpoint',
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

        await fixture.whenStable();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create', () => {
        expect(component).toBeInstanceOf(UpdateEndpointForm);
    });

    it('provides two endpoints', () => {
        expect(component.items().length).toBe(2);
    });

    it('should shows Endpoint A', () => {
        expect(component.index()).toBe(0);
        const item = component.form.items[0];
        expect(component.form.endpoint().value()).toBe('Endpoint A');
        expect(item.url().value()).toBe('http://example.com/endpoint');
        expect(item.authorization().value()).toBe('UpdateEndpointForm.API_KEY');
        expect(item.type().value()).toBe('AAS_API');
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

    it('should remove Endpoint A', async () => {
        vi.spyOn(PromptDialog, 'confirm').mockResolvedValue('Endpoint A');

        // Deleting is confirmed by typing the endpoint's name in the prompt dialog, so it must be
        // sent to the server right away -- it must not depend on the separate "OK" button being
        // clicked afterward, or a dismissed/forgotten dialog would silently discard the deletion.
        const deletePromise = component.deleteEndpoint();
        expect(PromptDialog.confirm).toHaveBeenCalled();

        await app.tick();
        httpController.expectOne({ method: 'DELETE', url: '/api/v1/endpoints/RW5kcG9pbnQgQQ' }).flush(null);

        // deleteEndpoint()'s own promise resolves once it has *triggered* the reload -- it doesn't
        // wait for that reload's request to actually complete, so await it before expecting that
        // request rather than after.
        await deletePromise;

        await app.tick();
        httpController.expectOne('/api/v1/endpoints').flush([
            {
                name: 'Endpoint B',
                url: 'opc.tcp://example.com:4840',
                type: 'OPC_UA',
            },
        ] satisfies AASEndpoint[]);

        await app.tick();
        await app.tick(); // let the resource-sync effect pick up the reloaded value

        expect(component.form.items.length).toBe(1);
        expect(component.form.endpoint().value()).toBe('Endpoint B');
        expect(component.index()).toBe(0);

        component.submit(new Event('submit'));
        expect(activeModal.close).toHaveBeenCalledWith({
            delete: [],
            update: [],
        } satisfies UpdateEndpointResult);
    });

    it('should update Endpoint A', async () => {
        const item = component.form.items[0];
        item.url().value.set('http://example.com/endpoint-updated');
        item.value().value.set('a-new-api-key-value');
        component.submit(new Event('submit'));
        expect(activeModal.close).toHaveBeenCalledWith({
            delete: [],
            update: [
                {
                    name: 'Endpoint A',
                    url: 'http://example.com/endpoint-updated',
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
});
