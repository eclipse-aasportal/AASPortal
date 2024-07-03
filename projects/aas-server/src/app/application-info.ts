/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { isAbsolute, resolve } from 'path/posix';
import { Message, PackageInfo } from 'aas-core';
import { Logger } from './logging/logger.js';
import { readFile } from 'fs/promises';
import { inject, singleton } from 'tsyringe';

@singleton()
export class ApplicationInfo {
    private data?: PackageInfo;

    public constructor(@inject('Logger') private readonly logger: Logger) {}

    public async getAsync(file?: string): Promise<PackageInfo> {
        if (!this.data) {
            this.data = await this.readAsync(file);
        }

        return this.data;
    }

    public getMessages(): Message[] {
        return this.logger.getMessages();
    }

    private async readAsync(file?: string): Promise<PackageInfo> {
        try {
            let path: string;
            if (file) {
                if (isAbsolute(file)) {
                    path = file;
                } else {
                    path = resolve('.', file);
                }
            } else {
                path = resolve('.', 'app-info.json');
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
