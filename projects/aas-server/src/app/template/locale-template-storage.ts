/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import fs from 'fs';
import path from 'path';
import { TemplateDescriptor, aas } from 'common';
import { Logger } from '../logging/logger.js';
import { readdir, readFile } from 'fs/promises';
import { JsonReader } from '../packages/json-reader.js';
import { AASReader } from '../packages/aas-reader.js';
import { JsonReaderV2 } from '../packages/json-reader-v2.js';
import * as aasV2 from '../types/aas-v2.js';
import { TemplateStorage } from './template-storage.js';
import { Variable } from '../variable.js';

@singleton()
export class LocalTemplateStorage extends TemplateStorage {
    private readonly dir: string;

    constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(Variable) variable: Variable
    ) {
        super();

        this.dir = path.resolve(variable.ASSETS, 'templates');
    }

    public override async readAsync(): Promise<TemplateDescriptor[]> {
        const descriptors: TemplateDescriptor[] = [];
        if (fs.existsSync(this.dir)) {
            await this.readDirAsync(this.dir, descriptors)
        }

        return descriptors;
    }

    private async readDirAsync(dir: string, descriptors: TemplateDescriptor[]): Promise<void> {
        for (const entry of await readdir(dir, { withFileTypes: true })) {
            if (entry.isFile()) {
                const file = path.join(dir, entry.name);
                const format = path.extname(file).toLowerCase();
                switch (format) {
                    case '.json':
                        descriptors.push({
                            name: path.basename(file, path.extname(format)),
                            endpoint: { type: 'file', address: file },
                            format: '.json',
                            template: await this.readTemplateAsync(file)
                        });
                        break;

                    case '.xml':
                        throw new Error(`Template format '${format}' is not implemented`);
                }
            }
            else if (entry.isDirectory()) {
                await this.readDirAsync(path.join(dir, entry.name), descriptors);
            }
        }
    }

    private async readTemplateAsync(file: string): Promise<aas.Referable> {
        const referable = JSON.parse((await readFile(file)).toString());
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