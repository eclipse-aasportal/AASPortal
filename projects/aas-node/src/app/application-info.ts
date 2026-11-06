/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { isAbsolute, resolve } from 'path/posix';
import { readFile } from 'fs/promises';
import { container, singleton } from 'tsyringe';
import { type AppInfo } from 'aas-core';
import { LOGGER } from 'aas-package';
import { Variable } from './variable.js';

@singleton()
export class ApplicationInfo {
    private readonly logger = container.resolve(LOGGER);
    private readonly variable = container.resolve(Variable);
    private data?: AppInfo;

    public async get(): Promise<AppInfo> {
        if (!this.data) {
            this.data = await this.read();
        }

        return this.data;
    }

    private async read(file?: string): Promise<AppInfo> {
        try {
            let path: string;
            if (file) {
                if (isAbsolute(file)) {
                    path = file;
                } else {
                    path = resolve(this.variable.ASSETS, file);
                }
            } else {
                path = resolve(this.variable.ASSETS, 'app-info.json');
            }

            return JSON.parse((await readFile(path)).toString());
        } catch (error) {
            this.logger.error(`Reading package failed: ${error?.message}`);
            return {
                name: '',
                version: '',
                author: '',
                description: '',
                license: '',
                homepage: '',
                libraries: [],
            };
        }
    }
}
