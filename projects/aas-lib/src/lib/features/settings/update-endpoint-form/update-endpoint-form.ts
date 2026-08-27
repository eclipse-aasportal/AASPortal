/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import {
    applyEach,
    form,
    FormField,
    max,
    min,
    readonly,
    required,
    SchemaPathTree,
    validate,
} from '@angular/forms/signals';
import { NgbActiveModal, NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import semver from 'semver';
import { AASEndpoint, AASEndpointScheduleType, AASEndpointType } from 'aas-core';
import { FormError } from '../../../shared/components/form-error/form-error';
import { PromptDialog } from '../../../core/prompt-dialog/prompt-dialog';
import { validateEndpointUrl } from '../../../utilities';
import { EndpointTemplate, templates } from '../endpoint-templates';
import { EndpointsApi } from '../../../shared/services/endpoints-api';
import { NotifyService } from '../../../core/notify/notify.service';

type AuthorizationType =
    'UpdateEndpointForm.NO_AUTH' | 'UpdateEndpointForm.API_KEY' | 'UpdateEndpointForm.BEARER_TOKEN';

interface EndpointItem {
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

interface UpdateEndpointModel {
    endpoint: string;
    items: EndpointItem[];
}

export interface UpdateEndpointResult {
    delete: string[];
    update: AASEndpoint[];
}

function ItemSchema(item: SchemaPathTree<EndpointItem>): void {
    readonly(item.name);
    validate(item.url, ({ value, valueOf }) => {
        const result = validateEndpointUrl(value(), valueOf(item.type));
        if (result) {
            return { kind: 'validUrl', message: 'UpdateEndpointForm.' + result };
        }

        return null;
    });
    min(item.minutes, 0, { message: 'UpdateEndpointForm.ERROR_MINUTES' });
    max(item.minutes, 59, { message: 'UpdateEndpointForm.ERROR_MINUTES' });
    min(item.hours, 0, { message: 'UpdateEndpointForm.ERROR_HOURS' });
    max(item.hours, 999, { message: 'UpdateEndpointForm.ERROR_HOURS' });
    required(item.key, {
        when: ({ valueOf }) => valueOf(item.authorization) === 'UpdateEndpointForm.API_KEY',
        message: 'UpdateEndpointForm.API_KEY_NAME_REQUIRED',
    });
    required(item.value, {
        when: ({ valueOf }) => valueOf(item.authorization) === 'UpdateEndpointForm.API_KEY',
        message: 'UpdateEndpointForm.API_KEY_VALUE_REQUIRED',
    });
    required(item.token, {
        when: ({ valueOf }) => valueOf(item.authorization) === 'UpdateEndpointForm.BEARER_TOKEN',
        message: 'UpdateEndpointForm.BEARER_TOKEN_REQUIRED',
    });
}

@Component({
    selector: 'fhg-update-endpoint-form',
    imports: [FormField, TranslateDirective, TranslatePipe, NgbDropdownModule, FormError],
    templateUrl: './update-endpoint-form.html',
    styleUrl: './update-endpoint-form.scss',
})
export class UpdateEndpointForm {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly modal = inject(NgbModal);
    private readonly translate = inject(TranslateService);
    private readonly api = inject(EndpointsApi);
    private readonly notify = inject(NotifyService);
    private readonly toDelete: string[] = [];
    private readonly _deleting = signal<string | undefined>(undefined);
    private readonly _templates = signal<EndpointTemplate[]>(templates);

    private readonly _endpoints = httpResource<AASEndpoint[]>(() => '/api/v1/endpoints', {
        defaultValue: [] as AASEndpoint[],
    });

    private readonly _template = signal<EndpointTemplate>(this._templates()[0]);

    private readonly model = signal<UpdateEndpointModel>({
        endpoint: '',
        items: [],
    });

    public constructor() {
        effect(() => {
            if (!this._endpoints.hasValue()) {
                this.form.items().value.set([]);
                return;
            }

            const items = this._endpoints
                .value()
                .map(endpoint => {
                    const header = endpoint.headers ? Object.entries(endpoint.headers).at(0) : undefined;
                    const schedule = endpoint.schedule ? endpoint.schedule.type : 'every';
                    let hours = 0;
                    let minutes = 0;
                    if (schedule === 'every') {
                        const ms = Number(endpoint.schedule?.values?.at(0));
                        if (isNaN(ms)) {
                            hours = 1;
                        } else {
                            hours = Math.floor(ms / 3600000);
                            minutes = Math.floor((ms % 3600000) / 60000);
                        }
                    }

                    return {
                        name: endpoint.name,
                        url: endpoint.url,
                        type: endpoint.type,
                        authorization: this.getAuthorization(header),
                        key: this.getApiKeyName(header),
                        value: '',
                        token: '',
                        schedule,
                        hours,
                        minutes,
                    } satisfies EndpointItem;
                })
                .sort((a, b) => a.name.localeCompare(b.name));

            this.form.items().value.set(items);
            if (items.length > 0) {
                this.form.endpoint().value.set(items[0].name);
            }
        });
    }

    public readonly canClose = computed(() => {
        const index = this.index();
        if (index < 0) {
            return false;
        }

        return this.toDelete.length > 0 || !this.form().invalid() || this.form().dirty();
    });

    public readonly authorizations = signal<AuthorizationType[]>([
        'UpdateEndpointForm.NO_AUTH',
        'UpdateEndpointForm.API_KEY',
        'UpdateEndpointForm.BEARER_TOKEN',
    ]).asReadonly();

    public readonly form = form(this.model, schemaPath => {
        applyEach(schemaPath.items, ItemSchema);
    });

    public readonly items = this.form.items().value.asReadonly();

    public readonly index = computed(() => {
        const name = this.form.endpoint().value();
        return this.items().findIndex(item => item.name === name);
    });

    public readonly templates = this._templates.asReadonly();

    public readonly template = this._template.asReadonly();

    public readonly deleting = this._deleting.asReadonly();

    public selectTemplate(value: EndpointTemplate): void {
        this._template.set(value);
    }

    public async deleteEndpoint(): Promise<void> {
        const name = this.form.endpoint().value();
        const value = await PromptDialog.confirm(
            this.modal,
            this.translate.instant('UpdateEndpointForm.DELETE_ENDPOINT_PROMPT', {
                name,
            }),
            name,
        );

        if (value !== name) {
            return;
        }

        // The confirm-by-typing-the-name prompt above is already the user's explicit confirmation,
        // so the endpoint is removed immediately here instead of only being staged for the separate
        // "OK" button -- previously, deleting only spliced the row out of this modal's local state,
        // so dismissing the dialog (or simply forgetting to click "OK" afterward) silently discarded
        // the deletion and the endpoint reappeared after a reload.
        this._deleting.set(name);
        try {
            await firstValueFrom(this.api.removeEndpoint(name));
            this.notify.info('Settings.AAS_ENDPOINT_DELETED', { endpoint: name });
            this._endpoints.reload();
        } catch (error) {
            this.notify.error(error);
        } finally {
            this._deleting.set(undefined);
        }
    }

    public submit(event: Event): void {
        event.preventDefault();
        const model = this.model();
        const result: UpdateEndpointResult = {
            delete: this.toDelete,
            update: [],
        };

        for (const modelItem of model.items) {
            const url = new URL(modelItem.url.trim());
            const type = modelItem.type;
            const version = type === 'AAS_API' ? (url.searchParams.get('version') ?? 'v3') : undefined;
            url.search = '';
            const endpoint: AASEndpoint = {
                name: modelItem.name,
                url: url.href,
                type,
            };

            if (version) {
                semver.valid(semver.coerce(version));
                endpoint.version = version;
            }

            if (modelItem.authorization === 'UpdateEndpointForm.API_KEY') {
                endpoint.headers = {
                    [modelItem.key]: modelItem.value,
                };
            } else if (modelItem.authorization === 'UpdateEndpointForm.BEARER_TOKEN') {
                endpoint.headers = {
                    Authorization: `Bearer ${modelItem.token}`,
                };
            }

            if (modelItem.schedule === 'every') {
                const ms = modelItem.hours * 3600000 + modelItem.minutes * 60000;
                endpoint.schedule = {
                    type: 'every',
                    values: [ms],
                };
            } else {
                endpoint.schedule = {
                    type: modelItem.schedule,
                };
            }

            if (this.isModified(endpoint)) {
                result.update.push(endpoint);
            }
        }

        this.activeModal.close(result);
    }

    public cancel(): void {
        this.activeModal.dismiss();
    }

    private getAuthorization(header?: [string, string]): AuthorizationType {
        if (!header) {
            return 'UpdateEndpointForm.NO_AUTH';
        }

        if (header[0].toLowerCase().includes('authorization')) {
            if (header[1].toLowerCase().startsWith('bearer')) {
                return 'UpdateEndpointForm.BEARER_TOKEN';
            }
        }

        return 'UpdateEndpointForm.API_KEY';
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

    private isModified(endpoint: AASEndpoint): boolean {
        const existing = this._endpoints.value().find(e => e.name === endpoint.name);
        if (!existing) {
            return true;
        }

        if (existing.url !== endpoint.url || existing.type !== endpoint.type) {
            return true;
        }

        const existingAuth = this.getAuthorization(
            existing.headers ? Object.entries(existing.headers).at(0) : undefined,
        );

        const newAuth = this.getAuthorization(endpoint.headers ? Object.entries(endpoint.headers).at(0) : undefined);
        if (existingAuth !== newAuth) {
            return true;
        }

        if (newAuth === 'UpdateEndpointForm.API_KEY') {
            const existingKey = this.getApiKeyName(
                existing.headers ? Object.entries(existing.headers).at(0) : undefined,
            );

            const newKey = this.getApiKeyName(endpoint.headers ? Object.entries(endpoint.headers).at(0) : undefined);
            if (existingKey !== newKey) {
                return true;
            }
        } else if (newAuth === 'UpdateEndpointForm.BEARER_TOKEN') {
            const newToken = endpoint.headers ? Object.entries(endpoint.headers).at(0)?.[1] : undefined;
            if (newToken) {
                return true;
            }
        }

        const scheduleType = existing.schedule?.type ?? 'every';
        if (scheduleType !== endpoint.schedule?.type) {
            return true;
        }

        if (scheduleType === 'every' && endpoint.schedule?.type === 'every') {
            const value = existing.schedule?.values?.at(0);
            const existingMs = value ? Number(value) : 3600000;
            const newMs = Number(endpoint.schedule.values?.at(0));
            if (existingMs !== newMs) {
                return true;
            }
        }

        return false;
    }
}
