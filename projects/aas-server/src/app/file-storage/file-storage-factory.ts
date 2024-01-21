/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import { inject, singleton } from 'tsyringe';
import { FileStorage } from './file-storage.js';
import { LocalFileStorage } from './local-file-storage.js';
import { parseUrl } from '../convert.js';
import { Variable } from '../variable.js';

@singleton()
export class FileStorageFactory {
    public constructor(@inject(Variable) private readonly variable: Variable) {}

    /**
     * Creates a FileStorage for the specified URL.
     * @param url The URL of the file storage.
     * @returns A new FileStorage instance.
     */
    public create(url: string | URL): FileStorage {
        const temp = typeof url === 'string' ? parseUrl(url) : url;
        if (temp.protocol === 'file:') {
            return new LocalFileStorage(path.join(this.variable.ASSETS, temp.pathname));
        }

        throw new Error('Not implemented.');
    }
}