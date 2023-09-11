/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DependencyContainer } from 'tsyringe';
import { TemplateStorage } from './template-storage.js';
import { Variable } from '../variable.js';
import { LocalTemplateStorage } from './locale-template-storage.js';

export class TemplateStorageFactory {
    constructor(private readonly container: DependencyContainer) { }

    public create(): TemplateStorage {
        const url = this.container.resolve(Variable).TEMPLATE_STORAGE;
        if (url) {
            throw new Error('Not implemented.');
        }

        return this.container.resolve(LocalTemplateStorage);
    }
}