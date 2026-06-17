/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { isAbsolute, resolve } from 'path/posix';
import { readFile } from 'fs/promises';
import { inject, singleton } from 'tsyringe';
import { type AppInfo } from 'aas-core';
import { LOGGER, Logger } from 'aas-package';
import { Variable } from './variable.js';

@singleton()
export class ApplicationInfo {
    private data?: AppInfo;

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(Variable) private readonly variable: Variable,
        data?: AppInfo,
    ) {
        this.data = data;
    }

    public async getAsync(): Promise<AppInfo> {
        if (!this.data) {
            this.data = await this.readAsync();
        }

        return this.data;
    }

    private async readAsync(file?: string): Promise<AppInfo> {
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
