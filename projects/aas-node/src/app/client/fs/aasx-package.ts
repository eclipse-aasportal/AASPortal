/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { extname } from 'path/posix';
import jszip from 'jszip';
import { aas } from 'aas-core';
import { AASReader, AasxFile, createJsonReader, createXmlReader, FileResult, XmlWriterV3 } from 'aas-package';

export class AasxPackage extends AasxFile {
    private constructor(zip: jszip, file?: string) {
        super(zip, file);
    }

    public async getEnvironment(): Promise<aas.Environment> {
        return (await this.createReader()).readEnvironment();
    }

    public async setEnvironment(env: aas.Environment): Promise<void> {
        const writer = new XmlWriterV3();
        const xml = writer.write(env);
        const path = await this.getOriginName();
        (await this.zip).file(path, xml, { compression: 'DEFLATE' });
        await this.save();
    }

    public async getThumbnail(): Promise<NodeJS.ReadableStream> {
        const result = await this.getPackageThumbnail();
        if (!result) {
            throw new Error(`A thumbnail does not exist.`);
        }

        return result.readable;
    }

    public async getThumbnailFile(): Promise<FileResult | undefined> {
        return await this.getPackageThumbnail();
    }

    public static async createFromFile(file: string): Promise<AasxPackage> {
        const zip = await AasxFile.createZip(file);
        return new AasxPackage(zip, file);
    }

    public static async createFromBuffer(buffer: Buffer<ArrayBufferLike>): Promise<AasxPackage> {
        const zip = await AasxFile.createZip(buffer);
        return new AasxPackage(zip);
    }

    private async createReader(): Promise<AASReader> {
        const name = await this.getOriginName();
        const extension = extname(name);
        switch (extension) {
            case '.xml': {
                const xml = await this.getZipEntry(name, 'string');
                return createXmlReader(xml, true);
            }
            case '.json': {
                const env = JSON.parse(await this.getZipEntry(name, 'string'));
                return createJsonReader(env, true);
            }
            default:
                throw new Error(`The AAS origin ${extension} is not supported.`);
        }
    }
}
