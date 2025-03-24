/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbDropdownModule, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AASEndpoint, AASEndpointScheduleType, AASEndpointType, stringFormat } from 'aas-core';

export interface HeaderItem {
    id: string;
    name: string;
    value: string;
}

export interface EndpointItem {
    type: AASEndpointType;
    placeholder: string;
}

@Component({
    selector: 'fhg-update-endpoint',
    templateUrl: './update-endpoint-form.component.html',
    styleUrls: ['./update-endpoint-form.component.scss'],
    imports: [NgbToast, NgbDropdownModule, TranslateModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateEndpointFormComponent {
    private readonly _messages = signal<string[]>([]);
    private _selectedItemIndex = signal(0);
    private readonly _endpoints = signal<AASEndpoint[]>([]);
    private readonly _selectedHeaderIndex = signal(-1);
    private readonly _headers = signal<HeaderItem[]>([{ id: '1', name: '', value: '' }]);
    private readonly _items = signal<EndpointItem[]>([
        {
            type: 'AAS_API',
            placeholder: 'UpdateEndpointForm.PLACEHOLDER_URL_HTTP',
        },
        {
            type: 'OPC_UA',
            placeholder: 'UpdateEndpointForm.PLACEHOLDER_URL_OPCUA',
        },
        {
            type: 'WebDAV',
            placeholder: 'UpdateEndpointForm.PLACEHOLDER_URL_WEBDAV',
        },
        {
            type: 'FileSystem',
            placeholder: 'UpdateEndpointForm.PLACEHOLDER_URL_FILE',
        },
    ]);

    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
    ) {
        effect(() => {
            const endpoint = this.endpoint();
            this.schedule.set(endpoint.schedule?.type || 'every');

            if (endpoint.headers) {
                const items: HeaderItem[] = [];
                let i = 1;
                for (const name in endpoint.headers) {
                    items.push({ id: String(i++), name, value: endpoint.headers[name] });
                }

                this._headers.set(items);
            }
        });
    }

    public readonly endpoints = this._endpoints.asReadonly();

    public readonly endpoint = signal<AASEndpoint>({
        name: '',
        url: '',
        type: 'AAS_API',
    });

    public readonly messages = this._messages.asReadonly();

    public readonly items = this._items.asReadonly();

    public readonly selectedItem = computed(() => this._items()[this._selectedItemIndex()]);

    public readonly schedule = signal<AASEndpointScheduleType>('every');

    public readonly minutes = signal(0);

    public readonly hours = signal(1);

    public readonly headers = this._headers.asReadonly();

    public readonly selectedHeader = computed(() =>
        this._selectedHeaderIndex() < 0 ? undefined : this._headers()[this._selectedHeaderIndex()],
    );

    public initialize(endpoints: AASEndpoint[]): void {
        if (endpoints.length > 0) {
            this._endpoints.set(endpoints);
            this.endpoint.set(endpoints[0]);
        }
    }

    public selectItem(value: EndpointItem): void {
        this._selectedItemIndex.set(this._items().indexOf(value));
        this.clearMessages();
    }

    public selectHeader(value: HeaderItem): void {
        this._selectedHeaderIndex.update(state => {
            const index = this._headers().indexOf(value);
            if (state >= 0 && index === state) {
                this.updateHeaders();
                return -1;
            }

            return index;
        });

        this.clearMessages();
    }

    public inputValue(): void {
        this.clearMessages();
    }

    public submit(): void {
        const selectedItem = this.selectedItem();
        if (selectedItem === undefined) {
            return;
        }

        this.clearMessages();
        const endpoint = cloneDeep(this.endpoint());
        const url = this.validateUrl(endpoint.url.trim(), selectedItem.type);
        if (url === undefined) {
            return;
        }

        const version = url.searchParams.get('version');
        url.search = '';
        if (version) {
            endpoint.version = version;
        } else if (selectedItem.type === 'AAS_API') {
            endpoint.version = 'v3';
        }

        endpoint.url = url.toString();

        switch (this.schedule()) {
            case 'disabled':
            case 'manual':
            case 'once':
                endpoint.schedule = { type: this.schedule() };
                break;
            default:
                endpoint.schedule = { type: 'every', values: [(this.hours() * 60 + this.minutes()) * 60000] };
                break;
        }

        const headers = this.headers().filter(header => header.name && header.value);
        if (headers.length > 0) {
            endpoint.headers = {};
            headers.forEach(header => (endpoint.headers![header.name] = header.value));
        }

        this.modal.close(endpoint);
    }

    public cancel(): void {
        this.modal.close();
    }

    private clearMessages(): void {
        if (this._messages.length > 0) {
            this._messages.set([]);
        }
    }

    private validateUrl(value: string, type: AASEndpointType): URL | undefined {
        try {
            const url = new URL(value);
            switch (type) {
                case 'AAS_API':
                    this.validateAASApiEndpoint(url);
                    break;
                case 'FileSystem':
                    this.validateFileSystemEndpoint(url);
                    break;
                case 'OPC_UA':
                    this.validateOpcuaEndpoint(url);
                    break;
                case 'WebDAV':
                    this.validateWebDAVEndpoint(url);
                    break;
            }

            return url;
        } catch {
            this._messages.update(messages => [...messages, this.createMessage('ERROR_INVALID_URL', value)]);
            return undefined;
        }
    }

    private createMessage(id: string, ...args: unknown[]): string {
        return stringFormat(this.translate.instant(id), args);
    }

    private validateAASApiEndpoint(url: URL): void {
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error('Protocol "http:" or "https:" expected.');
        }

        if (!url.hostname) {
            throw new Error('Empty host name.');
        }
    }

    private validateFileSystemEndpoint(url: URL): void {
        if (url.protocol !== 'file:') {
            throw new Error('Protocol "file:" expected');
        }

        if (url.hostname !== '') {
            throw new Error(`Invalid host name ${url.hostname}.`);
        }

        if (url.pathname === '/') {
            throw new Error('Empty pathname.');
        }
    }

    private validateOpcuaEndpoint(url: URL): void {
        if (url.protocol !== 'opc.tcp:') {
            throw new Error('Protocol "opc.tcp:" expected.');
        }

        if (!url.hostname) {
            throw new Error('Empty host name.');
        }
    }

    private validateWebDAVEndpoint(url: URL): void {
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error('Protocol "http:" or "https:" expected.');
        }

        if (!url.hostname) {
            throw new Error('Empty host name.');
        }
    }

    private updateHeaders(): void {
        this._headers.update(state => {
            let index = 1;
            const items: HeaderItem[] = [];
            for (const item of state) {
                if (item.name || item.value) {
                    items.push({ ...item, id: String(index++) });
                }
            }

            items.push({ id: String(index++), name: '', value: '' });
            return items;
        });
    }
}
