/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import { DependencyContainer } from 'tsyringe';
import { TemplateStorage } from './template-storage.js';
import { Variable } from '../variable.js';
import { OwnCloudStorage } from '../file-storage/own-cloud-storage.js';
import { FileStorage } from '../file-storage/file-storage.js';
import { LocalFileStorage } from '../file-storage/local-file-storage.js';
import { Logger } from '../logging/logger.js';

export class TemplateStorageFactory {
    public constructor(private readonly container: DependencyContainer) {}

    public create(): TemplateStorage {
        let fileStorage: FileStorage;
        const variable = this.container.resolve(Variable);
        const url = variable.TEMPLATE_STORAGE;
        if (url) {
            fileStorage = new OwnCloudStorage(url);
        } else {
            fileStorage = new LocalFileStorage(path.resolve(variable.ASSETS, 'templates'));
        }

        return new TemplateStorage(this.container.resolve<Logger>('Logger'), fileStorage);
    }
}
