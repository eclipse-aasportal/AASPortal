/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { httpResource } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, max, min, required, validate } from '@angular/forms/signals';
import { NgbActiveModal, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { AASEndpoint, AASEndpointScheduleType, AASEndpointType } from 'aas-core';
import { FormError } from '../../../shared/components/form-error/form-error';
import { validateEndpointUrl } from '../../../utilities';
import { EndpointTemplate, templates } from '../endpoint-templates';

type AuthorizationType = 'AddEndpointForm.NO_AUTH' | 'AddEndpointForm.API_KEY' | 'AddEndpointForm.BEARER_TOKEN';

interface EndpointModel {
    name: string;
    url: string;
    type: AASEndpointType;
    authorization: AuthorizationType;
    key: string;
    value: string;
    token: string;
    schedule: AASEndpointScheduleType;
    hours: number;
    minutes: number;
}

@Component({
    selector: 'fhg-add-endpoint-form',
    imports: [FormField, TranslateDirective, TranslatePipe, NgbDropdownModule, FormError],
    templateUrl: './add-endpoint-form.html',
    styleUrl: './add-endpoint-form.scss',
})
export class AddEndpointForm {
    private readonly modal = inject(NgbActiveModal);
    private readonly _templates = signal<EndpointTemplate[]>(templates);
    private readonly endpoints = httpResource<string[]>(() => '/api/v1/endpoints', {
        defaultValue: [] as string[],
        parse: values => (values as AASEndpoint[]).map(value => value.name).sort(),
    });

    private readonly _template = signal<EndpointTemplate>(this._templates()[0]);

    private readonly model = signal<EndpointModel>({
        name: '',
        url: '',
        type: 'AAS_API',
        authorization: 'AddEndpointForm.NO_AUTH',
        key: '',
        value: '',
        token: '',
        schedule: 'every',
        hours: 1,
        minutes: 0,
    });

    public readonly authorizations = signal<AuthorizationType[]>([
        'AddEndpointForm.NO_AUTH',
        'AddEndpointForm.API_KEY',
        'AddEndpointForm.BEARER_TOKEN',
    ]).asReadonly();

    public readonly form = form(this.model, schemaPath => {
        required(schemaPath.name, { message: 'AddEndpointForm.ERROR_NAME_REQUIRED' });
        validate(schemaPath.name, ({ value }) => {
            if (!this.endpoints.hasValue()) {
                return { kind: 'uniqueEndpointName', message: 'Loading...' };
            }

            const name = value();
            const endpoints = this.endpoints.value();
            if (endpoints.includes(name)) {
                return { kind: 'uniqueEndpointName', message: 'AddEndpointForm.ERROR_NAME_EXISTS' };
            }

            return null;
        });
        validate(schemaPath.url, ({ value, valueOf }) => {
            const result = validateEndpointUrl(value(), valueOf(schemaPath.type));
            if (result) {
                return { kind: 'validUrl', message: 'AddEndpointForm.' + result };
            }

            return null;
        });
        min(schemaPath.minutes, 0, { message: 'AddEndpointForm.ERROR_MINUTES' });
        max(schemaPath.minutes, 59, { message: 'AddEndpointForm.ERROR_MINUTES' });
        min(schemaPath.hours, 0, { message: 'AddEndpointForm.ERROR_HOURS' });
        max(schemaPath.hours, 999, { message: 'AddEndpointForm.ERROR_HOURS' });
        required(schemaPath.key, {
            when: ({ valueOf }) => valueOf(schemaPath.authorization) === 'AddEndpointForm.API_KEY',
            message: 'AddEndpointForm.API_KEY_NAME_REQUIRED',
        });
        required(schemaPath.value, {
            when: ({ valueOf }) => valueOf(schemaPath.authorization) === 'AddEndpointForm.API_KEY',
            message: 'AddEndpointForm.API_KEY_VALUE_REQUIRED',
        });
        required(schemaPath.token, {
            when: ({ valueOf }) => valueOf(schemaPath.authorization) === 'AddEndpointForm.BEARER_TOKEN',
            message: 'AddEndpointForm.BEARER_TOKEN_REQUIRED',
        });
    });

    public readonly templates = this._templates.asReadonly();

    public readonly template = this._template.asReadonly();

    public selectTemplate(type: AASEndpointType): void {
        this._template.set(this._templates().find(item => item.type === type)!);
    }

    public submit(event: Event): void {
        event.preventDefault();
        const model = this.model();

        const url = new URL(model.url.trim());
        const version = url.searchParams.get('version') ?? 'v3';
        url.search = '';

        const endpoint: AASEndpoint = {
            name: model.name,
            url: url.href,
            type: this.template().type,
            version,
        };

        switch (model.schedule) {
            case 'disabled':
            case 'manual':
            case 'once':
                endpoint.schedule = { type: model.schedule };
                break;
            default:
                endpoint.schedule = { type: 'every', values: [(model.hours * 60 + model.minutes) * 60000] };
                break;
        }

        switch (model.authorization) {
            case 'AddEndpointForm.API_KEY':
                endpoint.headers = { [model.key]: model.value };
                break;
            case 'AddEndpointForm.BEARER_TOKEN':
                endpoint.headers = { Authorization: `Bearer ${model.token}` };
                break;
        }

        this.modal.close(endpoint);
    }

    public cancel(): void {
        this.modal.dismiss();
    }
}
