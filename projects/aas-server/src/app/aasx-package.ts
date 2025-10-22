/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { extname } from 'path/posix';
import jszip from 'jszip';
import { aas, jsonization, toEnvironment, toJsonValue, types } from 'aas-core';
import { AasxFile, createXmlReader, XmlWriterV3 } from 'aas-package';

export class AasxPackage extends AasxFile {
    private constructor(zip: jszip, file?: string) {
        super(zip, file);
    }

    /**
     * Returns the identifiables contained in the AASX package.
     * @returns The identifiables contained in the AASX package.
     */
    public async getEnvironment(): Promise<types.Environment> {
        const name = await this.getOriginName();
        const extension = extname(name);
        let env: aas.Environment;
        if (extension === '.xml') {
            const xml = await this.getZipEntry(name, 'string');
            env = createXmlReader(xml).readEnvironment();
        } else {
            env = JSON.parse(await this.getZipEntry(name, 'string'));
        }

        await this.preprocess(env);

        const result = jsonization.environmentFromJsonable(toJsonValue(env));
        if (result.error) {
            throw result.error;
        }

        return result.mustValue();
    }

    /**
     * Writes the identifiables into the AASX package.
     * @param env The current `Environment`.
     */
    public async setEnvironment(env: types.Environment): Promise<void> {
        const zip = await this.zip;
        const writer = new XmlWriterV3();
        const xml = writer.write(toEnvironment(env));
        const path = await this.getOriginName();
        zip.file(path, xml, { compression: 'DEFLATE' });
    }

    public async getThumbnail(): Promise<NodeJS.ReadableStream> {
        const result = await this.getPackageThumbnail();
        if (!result) {
            throw new Error(`A thumbnail does not exist.`);
        }

        return result.readable;
    }

    public static async createFromFile(file: string): Promise<AasxPackage> {
        const zip = await AasxFile.createZip(file);
        return new AasxPackage(zip, file);
    }

    public static async createFromBuffer(buffer: Buffer<ArrayBufferLike>): Promise<AasxPackage> {
        const zip = await AasxFile.createZip(buffer);
        return new AasxPackage(zip);
    }

    private async preprocess(env: aas.Environment): Promise<void> {
        for (const shell of env.assetAdministrationShells) {
            if (!shell.assetInformation.defaultThumbnail) {
                const thumbnail = await this.getPackageThumbnail();
                if (thumbnail) {
                    shell.assetInformation.defaultThumbnail = {
                        path: thumbnail.filename,
                        contentType: thumbnail.contentType,
                    };
                }
            }
        }
    }
}
