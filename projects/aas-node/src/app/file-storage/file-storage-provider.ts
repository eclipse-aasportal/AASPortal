/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { LOGGER } from 'aas-package';

import { FileStorage } from './file-storage.js';
import { LocalFileStorage } from './local-file-storage.js';
import { Variable } from '../variable.js';
import { WebDAVStorage } from './webdav-storage.js';
import { urlToString } from '../utilities.js';

@singleton()
export class FileStorageProvider {
    private readonly variable = container.resolve(Variable);
    private readonly logger = container.resolve(LOGGER);
    private readonly instances = new Map<string, FileStorage>();

    /**
     * Gets a FileStorage for the specified URL.
     * @param url The URL of the file storage.
     * @returns A FileStorage instance.
     */
    public get(url: string | URL | undefined = 'file:///'): FileStorage {
        url = new URL(url);
        const key = url.protocol + '//' + url.host;
        let instance = this.instances.get(key);
        if (!instance) {
            instance = this.create(url);
            this.instances.set(key, instance);
            this.logger.info(`File storage "${key}" registered.`);
        }

        return instance;
    }

    private create(url: URL): FileStorage {
        url = new URL(url);
        switch (url.protocol) {
            case 'file:': {
                return new LocalFileStorage(url.href, this.variable.ASSETS);
            }
            case 'http:':
            case 'https:':
                if (!url.username) {
                    url.username = this.variable.AAS_NODE_USERNAME;
                }

                if (!url.password) {
                    url.password = this.variable.AAS_NODE_PASSWORD;
                }

                url.pathname = '';
                return new WebDAVStorage(url);
            default:
                throw new Error(`"${urlToString(url)}" is a not supported file storage.`);
        }
    }
}
