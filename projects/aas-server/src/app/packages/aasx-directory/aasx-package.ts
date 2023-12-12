/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { basename, extname } from 'path';
import jszip from 'jszip';
import xpath from 'xpath';
import { DOMParser } from '@xmldom/xmldom';
import { AasxDirectory } from './aasx-directory.js';
import { AASDocument, aas } from 'common';

import { Lazy } from '../../lazy.js';
import { AASPackage } from '../aas-package.js';
import { AASResource } from '../aas-resource.js';
import { Logger } from '../../logging/logger.js';
import { XmlReader } from '../xml-reader.js';
import { AASReader } from '../aas-reader.js';
import { JsonReaderV2 } from '../json-reader-v2.js';
import { JsonReader } from '../json-reader.js';
import * as aasV2 from '../../types/aas-v2.js';
import { ImageProcessing } from '../../image-processing.js';

export class AasxPackage extends AASPackage {
    private readonly file: string;
    private readonly source: AasxDirectory;
    private readonly zip: Lazy<jszip>;
    private originName: string | null = null;

    public constructor(logger: Logger, source: AASResource, file: string) {
        super(logger);

        this.source = source as AasxDirectory;
        this.file = file;
        this.zip = new Lazy<jszip>(this.initializeZip.bind(this));
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
                endpoint: this.source.name,
                address: this.file,
                idShort: environment.assetAdministrationShells[0].idShort,
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
        if(thumbnail) {
            document.thumbnail = thumbnail;
        }

        return document;
    }

    public override async readEnvironmentAsync(): Promise<aas.Environment> {
        return (await this.createReaderAsync()).readEnvironment();
    }

    public commitDocumentAsync(): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    public async openReadStreamAsync(_: aas.Environment, file: aas.File): Promise<NodeJS.ReadableStream> {
        if (!file.value) {
            throw new Error('Invalid operation.');
        }
        
        const name = this.normalize(file.value);
        const stream = (await this.zip.getValueAsync()).file(name)?.nodeStream();
        if (!stream) {
            throw Error(`ZIP entry '${name}' could not be opened.`);
        }

        return stream;
    }

    public async getThumbnailAsync(): Promise<NodeJS.ReadableStream> {
        let stream: NodeJS.ReadableStream | undefined;
        const relationships = await this.getRelationshipsAsync('_rels/.rels');
        for (const relationship of relationships) {
            if (relationship.getAttribute('Type') === 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail') {
                const value = relationship.getAttribute('Target');
                if (value) {
                    stream = (await this.zip.getValueAsync()).file(this.normalize(value))?.nodeStream();
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
            case '.xml':
                const xml = await this.getZipEntryAsync(name);
                return new XmlReader(this.logger, xml);
            case '.json':
                const env = JSON.parse(await this.getZipEntryAsync(name));
                return this.createJsonReader(env);
            default:
                throw new Error(`The AAS origin ${extension} is not supported.`);
        }
    }

    private async initializeZip(): Promise<jszip> {
        const data = await this.source.getStorage().readFile(this.file);
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

        const zip = await this.zip.getValueAsync();
        const file = zip.file(path);
        if (file === null) {
            throw new Error(`${path} is not a valid ZIP file.`)
        }

        return await file.async(contentType) as string;
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
        return index >= 0 ? fileName.substr(index).toLowerCase() : '';
    }

    private createJsonReader(env: object): AASReader {
        if ('assets' in env) {
            return new JsonReaderV2(this.logger, env as aasV2.AssetAdministrationShellEnvironment);
        }

        if ('assetAdministrationShells' in env && 'submodels' in env && 'conceptDescriptions' in env) {
            return new JsonReader(this.logger, env as aas.Environment);
        }

        throw new Error('Not implemented.');
    }

    private async createThumbnail(): Promise<string | undefined> {
        const input = await this.getThumbnailAsync();
        const output = await ImageProcessing.resizeAsync(input, 40, 40);
        return await this.streamToBase64(output);
    }
}