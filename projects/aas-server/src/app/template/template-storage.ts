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
import { inject, singleton } from 'tsyringe';
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';
import { Variable } from '../variable.js';
import { createJsonReader } from '../packages/create-json-reader.js';
import { createXmlReader } from '../packages/create-xml-reader.js';
import { AasxDirectory } from '../packages/file-system/aasx-directory.js';

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
        switch (extname(path)) {
            case '.json':
                return this.readFromJson(path);
            case '.xml':
                return this.readFromXml(path);
            case 'aasx':
                return this.readFromAasx(path);
            default:
                throw new Error('Not implemented.');
        }
    }

    private async readFromAasx(file: string): Promise<aas.Referable> {
        let source: AasxDirectory | undefined;
        try {
            source = new AasxDirectory(this.logger, this.fileStorage);
            await source.openAsync();
            const pkg = source.createPackage(file);
            return (await pkg.readEnvironmentAsync()).submodels[0];
        } finally {
            await source?.closeAsync();
        }
    }

    private async readFromXml(path: string): Promise<aas.Referable> {
        const xml = (await this.fileStorage.readFile(join(this.root, path))).toString();
        const env = createXmlReader(xml).readEnvironment();
        return env.submodels[0];
    }

    private async readFromJson(path: string): Promise<aas.Referable> {
        const referable = JSON.parse((await this.fileStorage.readFile(join(this.root, path))).toString());
        return createJsonReader(referable).read(referable);
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
            source = new AasxDirectory(this.logger, this.fileStorage);
            await source.openAsync();
            const pkg = source.createPackage(file);
            const submodel = (await pkg.readEnvironmentAsync()).submodels[0];
            return {
                modelType: submodel.modelType,
                idShort: submodel.idShort,
                id: submodel.id,
                format: '.xml',
                endpoint: { type: 'file', address: file },
            };
        } catch {
            return undefined;
        } finally {
            await source?.closeAsync();
        }
    }
}
