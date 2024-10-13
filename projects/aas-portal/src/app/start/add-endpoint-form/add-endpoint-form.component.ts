/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import head from 'lodash-es/head';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbDropdownModule, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AASEndpoint, AASEndpointType, stringFormat } from 'aas-core';

export interface HeaderItem {
    name: string;
    value: string;
    selected: boolean;
}

export interface EndpointItem {
    type: AASEndpointType;
    value: string;
    placeholder: string;
    headers: HeaderItem[];
    selected: boolean;
}

@Component({
    selector: 'fhg-add-endpoint',
    templateUrl: './add-endpoint-form.component.html',
    styleUrls: ['./add-endpoint-form.component.scss'],
    standalone: true,
    imports: [NgbToast, NgbDropdownModule, TranslateModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEndpointFormComponent {
    private readonly endpoints = signal<AASEndpoint[]>([]);
    private readonly _messages = signal<string[]>([]);
    private readonly _items = signal<EndpointItem[]>([
        {
            type: 'AAS_API',
            value: '',
            placeholder: 'AddEndpointForm.PLACEHOLDER_URL_HTTP',
            headers: [{ name: '', value: '', selected: true }],
            selected: true,
        },
        {
            type: 'OPC_UA',
            value: '',
            placeholder: 'AddEndpointForm.PLACEHOLDER_URL_OPCUA',
            headers: [{ name: '', value: '', selected: true }],
            selected: false,
        },
        {
            type: 'WebDAV',
            value: '',
            placeholder: 'AddEndpointForm.PLACEHOLDER_URL_WEBDAV',
            headers: [{ name: '', value: '', selected: true }],
            selected: false,
        },
        {
            type: 'FileSystem',
            value: '',
            placeholder: 'AddEndpointForm.PLACEHOLDER_URL_FILE',
            headers: [{ name: '', value: '', selected: true }],
            selected: false,
        },
    ]);

    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
    ) {}

    public readonly name = signal('');

    public readonly messages = this._messages.asReadonly();

    public readonly items = this._items.asReadonly();

    public readonly item = computed(() => this._items().find(item => item.selected)!);

    public readonly headers = computed(() => this.item().headers);

    public readonly header = computed(() => this.item().headers.find(header => header.selected)!);

    public readonly lastHeader = computed(() => head(this.headers())!);

    public initialize(endpoints: AASEndpoint[]): void {
        this.endpoints.set(endpoints);
    }

    public setItem(value: EndpointItem): void {
        this._items.update(items =>
            items.map(item => {
                item.selected = item === value;
                return item;
            }),
        );

        this.clearMessages();
    }

    public inputValue(): void {
        this.clearMessages();
    }

    public addHeader(): void {
        this._items.update(items =>
            items.map(item => {
                if (item.selected) {
                    const headers = item.headers.map(header => {
                        header.selected = false;
                        return header;
                    });

                    headers.push({ name: '', value: '', selected: true });
                    item.headers = headers;
                }

                return item;
            }),
        );
    }

    public removeHeader(header: HeaderItem): void {
        this._items.update(items =>
            items.map(item => {
                if (item.selected) {
                    item.headers = item.headers.filter(head => head !== header);
                }

                return item;
            }),
        );
    }

    public submit(): void {
        this.clearMessages();
        const name = this.validateName();
        const url = this.validateUrl(this.item().value.trim());
        if (name && url) {
            const version = url.searchParams.get('version');
            url.search = '';
            const endpoint: AASEndpoint = { url: url.href, name, type: this.item().type };
            if (version) {
                endpoint.version = version;
            } else if (this.item().type === 'AAS_API') {
                endpoint.version = 'v3';
            }

            const headers = this.item().headers.filter(header => header.name && header.value);
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

    private validateUrl(value: string): URL | undefined {
        try {
            const url = new URL(value);
            switch (this.item().type) {
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
            this._messages.update(messages => [
                ...messages,
                this.createMessage('ERROR_INVALID_URL', this.item().value),
            ]);

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

        if (url.pathname === '//' || url.pathname === '/') {
            throw new Error('Empty pathname.');
        }
    }

    private validateWebDAVEndpoint(url: URL): void {
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error('Protocol "http:" or "https:" expected.');
        }

        if (url.pathname === '/') {
            throw new Error('Empty pathname.');
        }
    }
}
