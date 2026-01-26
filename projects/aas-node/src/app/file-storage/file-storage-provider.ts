/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { FileStorage } from './file-storage.js';
import { LocalFileStorage } from './local-file-storage.js';
import { Variable } from '../variable.js';
import { WebDAVStorage } from './webdav-storage.js';
import { LOGGER, Logger } from '../logging/logger.js';
import { urlToString } from '../utilities.js';

@singleton()
export class FileStorageProvider {
    private readonly instances = new Map<string, FileStorage>();

    public constructor(
        @inject(Variable) private readonly variable: Variable,
        @inject(LOGGER) private readonly logger: Logger,
    ) {}

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
