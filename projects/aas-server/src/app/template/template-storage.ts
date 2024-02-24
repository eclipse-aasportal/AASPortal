/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { extname, join } from 'path/posix';
import { TemplateDescriptor, aas, isSubmodel } from 'common';
import { Logger } from '../logging/logger.js';
import { FileStorage } from '../file-storage/file-storage.js';
import { AASReader } from '../packages/aas-reader.js';
import { JsonReader } from '../packages/json-reader.js';
import { JsonReaderV2 } from '../packages/json-reader-v2.js';
import * as aasV2 from '../types/aas-v2.js';
import { inject, singleton } from 'tsyringe';
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';
import { Variable } from '../variable.js';

@singleton()
export class TemplateStorage {
    private readonly fileStorage: FileStorage;
    private readonly root: string;

    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(Variable) variable: Variable,
        @inject(FileStorageProvider) provider: FileStorageProvider,
    ) {
        const url = new URL(variable.TEMPLATE_STORAGE);
        this.root = url.pathname;
        url.pathname = '';
        this.fileStorage = provider.get(url);
    }

    public async readTemplatesAsync(): Promise<TemplateDescriptor[]> {
        const descriptors: TemplateDescriptor[] = [];
        if ((await this.fileStorage.exists(this.root)) === true) {
            await this.readDirAsync('', descriptors);
        }

        return descriptors;
    }

    public async readTemplateAsync(path: string): Promise<aas.Referable> {
        const referable = JSON.parse((await this.fileStorage.readFile(join(this.root, path))).toString());
        const reader = this.createReader(referable);
        return reader.read(referable);
    }

    private async readDirAsync(dir: string, descriptors: TemplateDescriptor[]): Promise<void> {
        const directories: string[] = [dir];
        while (directories.length > 0) {
            const directory = directories.pop()!;
            for (const entry of await this.fileStorage.readDir(join(this.root, directory))) {
                const path = join(directory, entry.name);
                if (entry.type === 'directory') {
                    directories.push(path);
                } else {
                    const format = extname(path).toLowerCase();
                    switch (format) {
                        case '.json':
                            {
                                const template = await this.readTemplateAsync(path);
                                const descriptor: TemplateDescriptor = {
                                    idShort: template.idShort,
                                    endpoint: { type: 'file', address: path },
                                    format: '.json',
                                    modelType: template.modelType,
                                };

                                if (isSubmodel(template)) {
                                    descriptor.id = template.id;
                                }

                                descriptors.push(descriptor);
                            }
                            break;

                        case '.xml':
                            throw new Error(`Template format '${format}' is not implemented`);
                    }
                }
            }
        }
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
