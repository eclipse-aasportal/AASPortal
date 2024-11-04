/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbCollapse, NgbDropdownModule, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AASEndpoint, AASEndpointScheduleType, AASEndpointType, stringFormat } from 'aas-core';

export interface HeaderItem {
    id: string;
    name: string;
    value: string;
}

export interface EndpointItem {
    type: AASEndpointType;
    value: string;
    placeholder: string;
}

@Component({
    selector: 'fhg-add-endpoint',
    templateUrl: './add-endpoint-form.component.html',
    styleUrls: ['./add-endpoint-form.component.scss'],
    standalone: true,
    imports: [NgbToast, NgbDropdownModule, NgbCollapse, TranslateModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEndpointFormComponent {
    private readonly endpoints = signal<AASEndpoint[]>([]);
    private readonly _messages = signal<string[]>([]);
    private _selectedItemIndex = signal(0);
    private readonly _items = signal<EndpointItem[]>([
        {
            type: 'AAS_API',
            value: '',
            placeholder: 'AddEndpointForm.PLACEHOLDER_URL_HTTP',
        },
        {
            type: 'OPC_UA',
            value: '',
            placeholder: 'AddEndpointForm.PLACEHOLDER_URL_OPCUA',
        },
        {
            type: 'WebDAV',
            value: '',
            placeholder: 'AddEndpointForm.PLACEHOLDER_URL_WEBDAV',
        },
        {
            type: 'FileSystem',
            value: '',
            placeholder: 'AddEndpointForm.PLACEHOLDER_URL_FILE',
        },
    ]);

    private readonly _selectedHeaderIndex = signal(-1);
    private readonly _headers = signal<HeaderItem[]>([{ id: '1', name: '', value: '' }]);

    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
    ) {}

    public readonly name = signal('');

    public readonly messages = this._messages.asReadonly();

    public readonly items = this._items.asReadonly();

    public readonly selectedItem = computed(() => this._items()[this._selectedItemIndex()]);

    public readonly schedule = signal<AASEndpointScheduleType>('every');

    public readonly minutes = signal(0);

    public readonly hours = signal(1);

    public readonly headers = this._headers.asReadonly();

    public readonly isCollapsed = signal(true);

    public readonly selectedHeader = computed(() =>
        this._selectedHeaderIndex() < 0 ? undefined : this._headers()[this._selectedHeaderIndex()],
    );

    public initialize(endpoints: AASEndpoint[]): void {
        this.endpoints.set(endpoints);
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
        const name = this.validateName();
        const url = this.validateUrl(selectedItem.value.trim(), selectedItem.type);
        if (name && url) {
            const version = url.searchParams.get('version');
            url.search = '';
            const endpoint: AASEndpoint = { url: url.href, name, type: selectedItem.type };
            if (version) {
                endpoint.version = version;
            } else if (selectedItem.type === 'AAS_API') {
                endpoint.version = 'v3';
            }

            switch (this.schedule()) {
                case 'never':
                    endpoint.schedule = { type: 'never' };
                    break;
                case 'once':
                    endpoint.schedule = { type: 'once' };
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
    }

    public cancel(): void {
        this.modal.close();
    }

    private clearMessages(): void {
        if (this._messages.length > 0) {
            this._messages.set([]);
        }
    }

    private validateName(): string | undefined {
        let name: string | undefined = this.name().trim();
        if (!name) {
            this._messages.update(messages => [...messages, this.createMessage('ERROR_EMPTY_ENDPOINT_NAME')]);
            name = undefined;
        } else {
            for (const endpoint of this.endpoints()) {
                if (endpoint.name.toLocaleLowerCase() === name.toLocaleLowerCase()) {
                    this._messages.update(messages => [
                        ...messages,
                        this.createMessage('ERROR_ENDPOINT_ALREADY_EXIST', name),
                    ]);
                    name = undefined;
                    break;
                }
            }
        }

        return name;
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
        } catch (error) {
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
