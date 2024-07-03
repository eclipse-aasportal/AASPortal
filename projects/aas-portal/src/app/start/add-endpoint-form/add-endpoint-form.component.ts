/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbDropdownModule, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AASEndpoint, AASEndpointType, stringFormat } from 'aas-core';

export interface EndpointItem {
    name: string;
    type: AASEndpointType;
    value: string;
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
    public readonly _messages = signal<string[]>([]);

    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
    ) {}

    public readonly messages = this._messages.asReadonly();

    public readonly name = signal('');

    public readonly items = signal<EndpointItem[]>([
        {
            name: this.translate.instant('AASEndpointType.AAS_API'),
            type: 'AAS_API',
            value: 'http://',
        },
        {
            name: this.translate.instant('AASEndpointType.OPC_UA'),
            type: 'OPC_UA',
            value: 'opc.tcp://',
        },
        {
            name: this.translate.instant('AASEndpointType.WebDAV'),
            type: 'WebDAV',
            value: 'http://',
        },
        {
            name: this.translate.instant('AASEndpointType.FileSystem'),
            type: 'FileSystem',
            value: 'file:///',
        },
    ]).asReadonly();

    public readonly item = signal(this.items()[0]);

    public initialize(endpoints: AASEndpoint[]): void {
        this.endpoints.set(endpoints);
    }

    public setItem(value: EndpointItem): void {
        this.item.set(value);
        this.clearMessages();
    }

    public inputValue(): void {
        this.clearMessages();
    }

    public submit(): void {
        this.clearMessages();
        const name = this.validateName();
        const url = this.validateUrl(this.item().value.trim());
        if (name && url) {
            let version = url.searchParams.get('version');
            url.search = '';
            const endpoint: AASEndpoint = { url: url.href, name, type: this.item().type };
            if (version) {
                endpoint.version = version;
            } else if (this.item().type === 'AAS_API') {
                version = 'v3';
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
