/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { isEmpty } from 'lodash-es';
import { FileStorage } from './file-storage.js';
import { LocalFileStorage } from './local-file-storage.js';
import { Variable } from '../variable.js';
import { WebDAVStorage } from './webdav-storage.js';

@singleton()
export class FileStorageProvider {
    private readonly instances = new Map<string, FileStorage>();

    public constructor(@inject(Variable) private readonly variable: Variable) {}

    /**
     * Gets a FileStorage for the specified URL.
     * @param url The URL of the file storage.
     * @returns A FileStorage instance.
     */
    public get(url: string | URL | undefined = 'file:///'): FileStorage {
        url = typeof url === 'string' ? new URL(url) : url;
        const key = url.protocol + '//' + url.host;
        let instance = this.instances.get(key);
        if (!instance) {
            instance = this.create(url);
            this.instances.set(key, instance);
        }

        return instance;
    }

    private create(url: URL): FileStorage {
        switch (url.protocol) {
            case 'file:':
                return new LocalFileStorage(this.variable.ASSETS);
            case 'http:':
            case 'https:':
                if (isEmpty(url.username)) {
                    url.username = this.variable.USERNAME;
                }

                if (isEmpty(url.password)) {
                    url.password = this.variable.PASSWORD;
                }

                return new WebDAVStorage(url);
            default:
                throw new Error(`${url.href} is an invalid URL or a not supported file storage.`);
        }
    }
}
