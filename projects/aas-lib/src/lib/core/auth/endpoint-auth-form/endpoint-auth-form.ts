/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { form, FormField, required, SchemaPathTree, applyEach } from '@angular/forms/signals';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { AASEndpoint, EndpointAuth } from 'aas-core';
import { FormError } from '../../../share/components/form-error/form-error';

type AuthorizationType = 'EndpointAuthForm.NO_AUTH' | 'EndpointAuthForm.API_KEY' | 'EndpointAuthForm.BEARER_TOKEN';

interface EndpointAuthItem {
    authorization: AuthorizationType;
    name: string;
    key: string;
    value: string;
    token: string;
}

interface EndpointAuthModel {
    endpoint: string;
    items: EndpointAuthItem[];
}

const initialState: EndpointAuthModel = {
    endpoint: '',
    items: [],
};

function ItemSchema(item: SchemaPathTree<EndpointAuthItem>): void {
    required(item.authorization);
    required(item.name);
    required(item.key, {
        when: ({ valueOf }) => valueOf(item.authorization) === 'EndpointAuthForm.API_KEY',
        message: 'EndpointAuthForm.API_KEY_NAME_REQUIRED',
    });
    required(item.value, {
        when: ({ valueOf }) => valueOf(item.authorization) === 'EndpointAuthForm.API_KEY',
        message: 'EndpointAuthForm.API_KEY_VALUE_REQUIRED',
    });
    required(item.token, {
        when: ({ valueOf }) => valueOf(item.authorization) === 'EndpointAuthForm.BEARER_TOKEN',
        message: 'EndpointAuthForm.BEARER_TOKEN_REQUIRED',
    });
}

@Component({
    selector: 'fhg-endpoint-auth-form',
    imports: [FormField, TranslateDirective, TranslatePipe, FormError],
    templateUrl: './endpoint-auth-form.html',
    styleUrl: './endpoint-auth-form.scss',
})
export class EndpointAuthForm {
    private readonly modal = inject(NgbActiveModal);
    private readonly model = signal<EndpointAuthModel>(initialState);

    private readonly endpointAuthItems = httpResource<EndpointAuth[]>(() => '/api/v1/endpoints/auth', {
        defaultValue: [] as EndpointAuth[],
    });

    private readonly endpoints = httpResource<string[]>(() => '/api/v1/endpoints', {
        defaultValue: [] as string[],
        parse: values => (values as AASEndpoint[]).map(value => value.name).sort(),
    });

    public constructor() {
        effect(() => {
            if (!this.endpoints.hasValue() || !this.endpointAuthItems.hasValue()) {
                return;
            }

            const authItems = this.endpointAuthItems.value();
            const endpoints = this.endpoints.value();
            const items = endpoints.map(endpoint => {
                const authItem = authItems.find(item => item.name === endpoint);
                const header = authItem ? Object.entries(authItem.headers).at(0) : undefined;
                const item: EndpointAuthItem = {
                    name: endpoint,
                    authorization: this.getAuthorization(header),
                    key: this.getApiKeyName(header),
                    value: '',
                    token: '',
                };

                return item;
            });

            this.items().value.set(items);
            if (items.length > 0) {
                this.endpoint().value.set(items[0].name);
            }
        });
    }

    public readonly form = form(this.model, schemaPath => {
        required(schemaPath.endpoint);
        applyEach(schemaPath.items, ItemSchema);
    });

    public readonly authorizations = signal<AuthorizationType[]>([
        'EndpointAuthForm.NO_AUTH',
        'EndpointAuthForm.API_KEY',
        'EndpointAuthForm.BEARER_TOKEN',
    ]).asReadonly();

    public readonly index = computed(() => {
        const endpoint = this.endpoint().value();
        const items = untracked(this.items().value);
        return items.findIndex(item => item.name === endpoint);
    });

    public readonly endpoint = this.form.endpoint;

    public readonly items = this.form.items;

    public cancel(): void {
        this.modal.dismiss();
    }

    public submit(event: Event): void {
        event.preventDefault();

        const authItems = this.model()
            .items.filter(item => this.isModified(item))
            .map(item => {
                return {
                    name: item.name,
                    authorization: item.authorization,
                    key: item.key.trim(),
                    value: item.value.trim(),
                    token: item.token.trim(),
                } satisfies EndpointAuthItem;
            });

        if (this.validate(authItems).length === 0) {
            this.modal.close(authItems.map(item => this.toEndpointAuth(item)));
        }
    }

    private getAuthorization(header?: [string, string]): AuthorizationType {
        if (!header) {
            return 'EndpointAuthForm.NO_AUTH';
        }

        if (header[0].toLowerCase().includes('authorization')) {
            return 'EndpointAuthForm.BEARER_TOKEN';
        }

        return 'EndpointAuthForm.API_KEY';
    }

    private getApiKeyName(header?: [string, string]): string {
        if (!header) {
            return '';
        }

        if (!header[0].toLowerCase().includes('authorization')) {
            return header[0];
        }

        return '';
    }

    private isModified(item: EndpointAuthItem): boolean {
        const authItems = untracked(this.endpointAuthItems.value);
        const authItem = authItems.find(auth => auth.name === item.name);
        if (!authItem) {
            return item.authorization !== 'EndpointAuthForm.NO_AUTH' || item.value !== '' || item.token !== '';
        }

        const header = Object.entries(authItem.headers).at(0);
        const authorization = this.getAuthorization(header);
        if (authorization !== item.authorization) {
            return true;
        }

        if (authorization === 'EndpointAuthForm.API_KEY') {
            return item.key !== this.getApiKeyName(header) || item.value !== '';
        }

        if (authorization === 'EndpointAuthForm.BEARER_TOKEN') {
            return item.token !== '';
        }

        return false;
    }

    private validate(items: EndpointAuthItem[]): string[] {
        const errors: string[] = [];
        for (const item of items) {
            if (item.authorization === 'EndpointAuthForm.API_KEY') {
                if (item.key === '') {
                    errors.push(`Endpoint "${item.name}": API key name is required.`);
                }

                if (item.value === '') {
                    errors.push(`Endpoint "${item.name}": API key value is required.`);
                }
            }

            if (item.authorization === 'EndpointAuthForm.BEARER_TOKEN') {
                if (item.token === '') {
                    errors.push(`Endpoint "${item.name}": Bearer token is required.`);
                }
            }
        }

        return errors;
    }

    private toEndpointAuth(item: EndpointAuthItem): EndpointAuth {
        const headers: Record<string, string> = {};
        if (item.authorization === 'EndpointAuthForm.API_KEY') {
            headers[item.key] = item.value;
        } else if (item.authorization === 'EndpointAuthForm.BEARER_TOKEN') {
            headers['Authorization'] = `Bearer ${item.token}`;
        }

        return {
            name: item.name,
            headers,
        };
    }
}
