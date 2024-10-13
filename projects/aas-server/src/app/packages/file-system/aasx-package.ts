/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import { basename, extname } from 'path/posix';
import jszip from 'jszip';
import xpath from 'xpath';
import { DOMParser } from '@xmldom/xmldom';
import { AasxDirectory } from './aasx-directory.js';
import { AASDocument, aas } from 'aas-core';

import { AASPackage } from '../aas-package.js';
import { AASResource } from '../aas-resource.js';
import { Logger } from '../../logging/logger.js';
import { AASReader } from '../aas-reader.js';
import { ImageProcessing } from '../../image-processing.js';
import { createXmlReader } from '../create-xml-reader.js';
import { createJsonReader } from '../create-json-reader.js';
import { XmlWriterV3 } from '../xml-writer-v3.js';

export class AasxPackage extends AASPackage {
    private readonly file: string;
    private readonly source: AasxDirectory;
    private readonly zip: Promise<jszip>;
    private originName: string | null = null;

    public constructor(logger: Logger, source: AASResource, file: string) {
        super(logger);

        this.source = source as AasxDirectory;
        this.file = file;
        this.zip = this.loadAsync();
    }

    public async createDocumentAsync(): Promise<AASDocument> {
        let document: AASDocument;
        const format = extname(this.file);
        if (format === '.aasx') {
            const reader = await this.createReaderAsync();
            const environment = reader.readEnvironment();
            const id = environment.assetAdministrationShells[0].id;
            document = {
                id: id,
                endpoint: this.source.endpoint.name,
                address: this.file,
                idShort: environment.assetAdministrationShells[0].idShort,
                assetId: environment.assetAdministrationShells[0].assetInformation.globalAssetId,
                readonly: this.source.readOnly,
                onlineReady: this.source.onlineReady,
                content: environment,
                timestamp: Date.now(),
                crc32: this.computeCrc32(environment),
            };
        } else {
            throw new Error(`Asset format ${format} is not supported.`);
        }

        const thumbnail = await this.createThumbnail();
        if (thumbnail) {
            document.thumbnail = thumbnail;
        }

        return document;
    }

    public override async getEnvironmentAsync(): Promise<aas.Environment> {
        return (await this.createReaderAsync()).readEnvironment();
    }

    public override async setEnvironmentAsync(env: aas.Environment): Promise<string[]> {
        const writer = new XmlWriterV3();
        const xml = writer.write(env);
        const path = await this.getOriginNameAsync();
        (await this.zip).file(path, xml, { compression: 'DEFLATE' });
        await this.saveAsync();
        return [`${this.file} successfully written.`];
    }

    public override async openReadStreamAsync(_: aas.Environment, file: aas.File): Promise<NodeJS.ReadableStream> {
        if (!file.value) {
            throw new Error('Invalid operation.');
        }

        const name = this.normalize(file.value);
        const stream = (await this.zip).file(name)?.nodeStream();
        if (!stream) {
            throw Error(`ZIP entry '${name}' could not be opened.`);
        }

        return stream;
    }

    public override async getThumbnailAsync(): Promise<NodeJS.ReadableStream> {
        let stream: NodeJS.ReadableStream | undefined;
        const relationships = await this.getRelationshipsAsync('_rels/.rels');
        for (const relationship of relationships) {
            if (
                relationship.getAttribute('Type') ===
                'http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail'
            ) {
                const value = relationship.getAttribute('Target');
                if (value) {
                    stream = (await this.zip).file(this.normalize(value))?.nodeStream();
                    if (stream) {
                        break;
                    }
                }
            }
        }

        if (!stream) {
            throw new Error(`${this.file} has no thumbnail.`);
        }

        return stream;
    }

    private async createReaderAsync(): Promise<AASReader> {
        const name = await this.getOriginNameAsync();
        const extension = extname(name);
        switch (extension) {
            case '.xml': {
                const xml = await this.getZipEntryAsync(name);
                return createXmlReader(xml);
            }
            case '.json': {
                const env = JSON.parse(await this.getZipEntryAsync(name));
                return createJsonReader(env);
            }
            default:
                throw new Error(`The AAS origin ${extension} is not supported.`);
        }
    }

    private async loadAsync(): Promise<jszip> {
        const data = await this.source.readFile(this.file);
        return await jszip.loadAsync(data);
    }

    private async getOriginNameAsync(): Promise<string> {
        if (this.originName === null) {
            const relationships = await this.getRelationshipsAsync('aasx/_rels/aasx-origin.rels');
            for (const relationship of relationships) {
                if (relationship.getAttribute('Type') === 'http://www.admin-shell.io/aasx/relationships/aas-spec') {
                    this.originName = relationship.getAttribute('Target');
                    break;
                }
            }

            if (this.originName === null) {
                throw new Error('Unable to determine origin name.');
            }
        }

        return this.originName;
    }

    private async getRelationshipsAsync(path: string): Promise<Element[]> {
        const xml = await this.getZipEntryAsync(path);
        const xmldoc = new DOMParser().parseFromString(xml);
        const opnxml = xpath.useNamespaces({ opnxml: 'http://schemas.openxmlformats.org/package/2006/relationships' });
        return opnxml('/opnxml:Relationships/opnxml:Relationship', xmldoc) as Element[];
    }

    private async getZipEntryAsync(path: string, contentType?: jszip.OutputType): Promise<string> {
        if (path.charAt(0) === '/') {
            path = path.slice(1);
        }

        if (!contentType) {
            contentType = this.getContentType(basename(path));
        }

        const zip = await this.zip;
        const file = zip.file(path);
        if (file === null) {
            throw new Error(`${path} is not a valid ZIP file.`);
        }

        return (await file.async(contentType)) as string;
    }

    private async saveAsync(): Promise<void> {
        const zip = await this.zip;
        await new Promise<void>((resolve, reject) => {
            zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
                .pipe(fs.createWriteStream(this.file))
                .on('finish', () => resolve())
                .on('error', error => reject(error));
        });
    }

    private getContentType(fileName: string): jszip.OutputType {
        let contentType: jszip.OutputType;
        const extension = this.getExtension(fileName);
        switch (extension) {
            case '.xml':
            case '.rels':
            case '.json':
                contentType = 'string';
                break;
            case '.png':
            case '.jpeg':
            case '.jpg':
                contentType = 'uint8array';
                break;
            default:
                throw new Error('Not supported extension ' + extension);
        }

        return contentType;
    }

    private getExtension(fileName: string): string {
        const index = fileName.lastIndexOf('.');
        return index >= 0 ? fileName.substring(index).toLowerCase() : '';
    }

    private async createThumbnail(): Promise<string | undefined> {
        try {
            const input = await this.getThumbnailAsync();
            const output = await ImageProcessing.resizeAsync(input, 40, 40);
            return await this.streamToBase64(output);
        } catch {
            return undefined;
        }
    }
}
