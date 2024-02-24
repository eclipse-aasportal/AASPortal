/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { AASEndpoint, AASEndpointType, stringFormat } from 'common';

export interface EndpointItem {
    name: string;
    type: AASEndpointType;
    value: string;
}

@Component({
    selector: 'fhg-add-endpoint',
    templateUrl: './add-endpoint-form.component.html',
    styleUrls: ['./add-endpoint-form.component.scss'],
})
export class AddEndpointFormComponent {
    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
    ) {
        this.items = [
            {
                name: this.translate.instant('AASEndpointType.AASServer'),
                type: 'AASServer',
                value: 'http://',
            },
            {
                name: this.translate.instant('AASEndpointType.OpcuaServer'),
                type: 'OpcuaServer',
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
        ];

        this.item = this.items[0];
    }

    public endpoints: AASEndpoint[] = [];

    public messages: string[] = [];

    public name = '';

    public version = 'v3';

    public readonly items: EndpointItem[];

    public item: EndpointItem;

    public setItem(value: EndpointItem): void {
        this.item = value;
        this.clearMessages();
    }

    public inputValue(): void {
        this.clearMessages();
    }

    public submit(): void {
        this.clearMessages();
        const name = this.validateName();
        const url = this.validateUrl(this.item.value.trim());
        if (name && url) {
            const endpoint: AASEndpoint = { url: url.href, name, type: this.item.type, version: this.version };
            this.modal.close(endpoint);
        }
    }

    public cancel(): void {
        this.modal.close();
    }

    private clearMessages(): void {
        if (this.messages.length > 0) {
            this.messages = [];
        }
    }

    private validateName(): string | undefined {
        let name: string | undefined = this.name.trim();
        if (!name) {
            this.messages.push(this.createMessage('ERROR_EMPTY_ENDPOINT_NAME'));
            name = undefined;
        } else {
            for (const endpoint of this.endpoints) {
                if (endpoint.name.toLocaleLowerCase() === name.toLocaleLowerCase()) {
                    this.messages.push(this.createMessage('ERROR_ENDPOINT_ALREADY_EXIST', name));
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
            switch (this.item.type) {
                case 'AASServer':
                    this.validateAASServerEndpoint(url);
                    break;
                case 'FileSystem':
                    this.validateFileSystemEndpoint(url);
                    break;
                case 'OpcuaServer':
                    this.validateOpcuaEndpoint(url);
                    break;
                case 'WebDAV':
                    this.validateWebDAVEndpoint(url);
                    break;
            }

            return url;
        } catch (error) {
            this.messages.push(this.createMessage('ERROR_INVALID_URL', this.item.value));
            return undefined;
        }
    }

    private createMessage(id: string, ...args: unknown[]): string {
        return stringFormat(this.translate.instant(id), args);
    }

    private validateAASServerEndpoint(url: URL): void {
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error('Protocol "http:" or "https:" expected.');
        }

        if (url.pathname !== '/') {
            throw new Error(`Unexpected pathname "${url.pathname}".`);
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
