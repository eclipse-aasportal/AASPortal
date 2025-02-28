/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import isEmpty from 'lodash-es/isEmpty.js';
import { FileStorage } from './file-storage.js';
import { LocalFileStorage } from './local-file-storage.js';
import { Variable } from '../variable.js';
import { WebDAVStorage } from './webdav-storage.js';
import { Logger } from '../logging/logger.js';
import { urlToString } from '../convert.js';

@singleton()
export class FileStorageProvider {
    private readonly instances = new Map<string, FileStorage>();

    public constructor(
        @inject(Variable) private readonly variable: Variable,
        @inject('Logger') private readonly logger: Logger,
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
                if (isEmpty(url.username)) {
                    url.username = this.variable.AAS_NODE_USERNAME;
                }

                if (isEmpty(url.password)) {
                    url.password = this.variable.AAS_NODE_PASSWORD;
                }

                url.pathname = '';
                return new WebDAVStorage(url);
            default:
                throw new Error(`"${urlToString(url)}" is a not supported file storage.`);
        }
    }
}
