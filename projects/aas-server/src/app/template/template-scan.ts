/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { parentPort } from 'worker_threads';
import { extname, join } from 'path/posix';
import { TemplateDescriptor, isSubmodel } from 'aas-core';
import { Logger } from '../logging/logger.js';
import { FileStorage } from '../file-storage/file-storage.js';
import { inject, singleton } from 'tsyringe';
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';
import { Variable } from '../variable.js';
import { createJsonReader } from '../packages/create-json-reader.js';
import { createXmlReader } from '../packages/create-xml-reader.js';
import { AasxDirectory } from '../packages/file-system/aasx-directory.js';
import { ScanResultType, ScanTemplatesResult } from '../aas-provider/scan-result.js';
import { toUint8Array } from '../convert.js';
import { WorkerData } from '../aas-provider/worker-data.js';

@singleton()
export class TemplateScan {
    private readonly fileStorage: FileStorage;
    private readonly root: string;
    private readonly url: URL;

    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(Variable) variable: Variable,
        @inject(FileStorageProvider) provider: FileStorageProvider,
    ) {
        this.url = new URL(variable.TEMPLATE_STORAGE);
        this.root = this.url.pathname;
        this.fileStorage = provider.get(this.url);
    }

    public async scanAsync(data: WorkerData): Promise<void> {
        const templates: TemplateDescriptor[] = [];
        if ((await this.fileStorage.exists(this.root)) === true) {
            await this.readDirAsync('', templates);
        }

        const value: ScanTemplatesResult = {
            taskId: data.taskId,
            type: ScanResultType.Update,
            templates: templates,
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    }

    private async readDirAsync(dir: string, descriptors: TemplateDescriptor[]): Promise<void> {
        const directories: string[] = [dir];
        while (directories.length > 0) {
            const directory = directories.pop()!;
            for (const entry of await this.fileStorage.readDir(join(this.root, directory))) {
                const file = join(directory, entry.name);
                if (entry.type === 'directory') {
                    directories.push(file);
                } else {
                    const format = extname(file).toLowerCase();
                    let descriptor: TemplateDescriptor | undefined;
                    switch (format) {
                        case '.json':
                            descriptor = await this.fromJsonFile(file);
                            break;

                        case '.xml':
                            descriptor = await this.fromXmlFile(file);
                            break;

                        case '.aasx':
                            descriptor = await this.fromAasxFile(file);
                            break;
                    }

                    if (descriptor) {
                        descriptors.push(descriptor);
                    }
                }
            }
        }
    }

    private async fromJsonFile(file: string): Promise<TemplateDescriptor | undefined> {
        try {
            const referable = JSON.parse((await this.fileStorage.readFile(join(this.root, file))).toString());
            const template = createJsonReader(referable).read(referable);
            const descriptor: TemplateDescriptor = {
                idShort: template.idShort,
                endpoint: { type: 'file', address: file },
                format: '.json',
                modelType: template.modelType,
            };

            if (isSubmodel(template)) {
                descriptor.id = template.id;
            }

            return descriptor;
        } catch {
            return undefined;
        }
    }

    private async fromXmlFile(file: string): Promise<TemplateDescriptor | undefined> {
        try {
            const xml = (await this.fileStorage.readFile(join(this.root, file))).toString();
            const submodel = createXmlReader(xml).readEnvironment().submodels[0];
            return {
                modelType: submodel.modelType,
                idShort: submodel.idShort,
                id: submodel.id,
                format: '.xml',
                endpoint: { type: 'file', address: file },
            };
        } catch {
            return undefined;
        }
    }

    private async fromAasxFile(file: string): Promise<TemplateDescriptor | undefined> {
        let source: AasxDirectory | undefined;
        try {
            source = new AasxDirectory(this.logger, this.fileStorage, this.url);
            await source.openAsync();
            const pkg = source.createPackage(file);
            const submodel = (await pkg.getEnvironmentAsync()).submodels[0];
            return {
                modelType: submodel.modelType,
                idShort: submodel.idShort,
                id: submodel.id,
                format: '.aasx',
                endpoint: { type: 'file', address: file },
            };
        } catch {
            return undefined;
        } finally {
            await source?.closeAsync();
        }
    }
}
