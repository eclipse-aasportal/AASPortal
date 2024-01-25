/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { basename, extname, join } from 'path';
import { TemplateDescriptor, aas } from 'common';
import { Logger } from '../logging/logger.js';
import { FileStorage } from '../file-storage/file-storage.js';
import { AASReader } from '../packages/aas-reader.js';
import { JsonReader } from '../packages/json-reader.js';
import { JsonReaderV2 } from '../packages/json-reader-v2.js';
import * as aasV2 from '../types/aas-v2.js';

export class TemplateStorage {
    public constructor(
        private readonly logger: Logger,
        private readonly fileStorage: FileStorage,
        private readonly root = 'templates',
    ) {}

    public async readAsync(): Promise<TemplateDescriptor[]> {
        const descriptors: TemplateDescriptor[] = [];
        if (await this.fileStorage.exists(this.root)) {
            await this.readDirAsync('', descriptors);
        }

        return descriptors;
    }

    private async readDirAsync(dir: string, descriptors: TemplateDescriptor[]): Promise<void> {
        for (const entry of await this.fileStorage.readDir(join(this.root, dir))) {
            const path = join(dir, entry);
            if (await this.fileStorage.isDirectory(path)) {
                await this.readDirAsync(path, descriptors);
            } else {
                const format = extname(path).toLowerCase();
                switch (format) {
                    case '.json':
                        descriptors.push({
                            name: basename(path, extname(format)),
                            endpoint: { type: 'file', address: path },
                            format: '.json',
                            template: await this.readTemplateAsync(path),
                        });
                        break;

                    case '.xml':
                        throw new Error(`Template format '${format}' is not implemented`);
                }
            }
        }
    }

    private async readTemplateAsync(path: string): Promise<aas.Referable> {
        const referable = JSON.parse((await this.fileStorage.readFile(join(this.root, path))).toString());
        const reader = this.createReader(referable);
        return reader.read(referable);
    }

    private createReader(referable: object): AASReader {
        if (typeof (referable as aas.Referable).modelType === 'string') {
            return new JsonReader(this.logger);
        }

        if (typeof (referable as aasV2.Referable).modelType?.name === 'string') {
            return new JsonReaderV2(this.logger);
        }

        throw new Error('Not implemented.');
    }
}
