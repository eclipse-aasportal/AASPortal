/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import { basename, extname } from 'path/posix';
import jszip from 'jszip';
import xpath from 'xpath';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { aas, jsonization, types } from 'aas-core';

import { XmlWriter } from './xml-writer.js';
import { XmlReader } from './xml-reader.js';
import { mimeType, toEnvironment, toJsonValue } from './utilities.js';
import { FileResult } from './types.js';

const thumbnailNS = 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail';

export class AasxPackage {
    private readonly file: string;
    private readonly _zip: Promise<jszip>;
    private originName: string | null = null;
    private relSelect: xpath.XPathSelect;
    private contentTypesSelect: xpath.XPathSelect;

    public constructor(file: string) {
        this.file = file;
        if (fs.existsSync(file)) {
            this._zip = this.load();
        } else {
            this._zip = Promise.resolve(new jszip());
        }

        this.relSelect = xpath.useNamespaces({
            openxml: 'http://schemas.openxmlformats.org/package/2006/relationships',
        });

        this.contentTypesSelect = xpath.useNamespaces({
            openxml: 'http://schemas.openxmlformats.org/package/2006/content-types',
        });
    }

    /** Gets the ZIP archive. */
    public get zip(): Promise<jszip> {
        return this._zip;
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
            const xml = await this.getZipEntry(name);
            env = new XmlReader(xml).readEnvironment();
        } else {
            env = JSON.parse(await this.getZipEntry(name));
        }

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
        const zip = await this._zip;
        const writer = new XmlWriter();
        const xml = writer.write(toEnvironment(env));
        const path = await this.getOriginName();
        zip.file(path, xml, { compression: 'DEFLATE' });
    }

    /**
     * Reads the file that has a relationship to a File element.
     * @param path The file path.
     * @returns A readable stream.
     */
    public async read(path: string): Promise<NodeJS.ReadableStream> {
        const stream = (await this._zip).file(this.normalize(path))?.nodeStream();
        if (!stream) {
            throw Error(`ZIP entry '${path}' could not be opened.`);
        }

        return stream;
    }

    /**
     * Writes a new or updates an existing file in the AASX package that has a relationship to a File element.
     * @param path The file path.
     * @param stream A readable stream.
     */
    public async write(path: string, stream: NodeJS.ReadableStream): Promise<void> {
        const zip = await this._zip;
        zip.file(this.normalize(path), stream, { compression: 'DEFLATE' });
        await this.setContentType(path);
    }

    /**
     * Removes a file with the specified path from the AASX package.
     * @param path The path of the file to remove.
     */
    public async remove(path: string): Promise<void> {
        const zip = await this._zip;
        zip.remove(this.normalize(path));
    }

    /**
     * Returns the name or path of the thumbnail file.
     * @returns The name of the thumbnail file or `undefined`.
     */
    public async getThumbnailName(): Promise<string | undefined> {
        const dom = await this.getDom('_rels/.rels');
        const value = (await this.getTargetAttr(dom, thumbnailNS))?.value;
        if (value) {
            return this.normalize(value);
        }

        return undefined;
    }

    /**
     * Returns the thumbnail image of the current AASX package.
     * @returns The thumbnail image or `undefined`.
     */
    public async getThumbnail(): Promise<FileResult | undefined> {
        let stream: NodeJS.ReadableStream | undefined;
        const dom = await this.getDom('_rels/.rels');
        const value = (await this.getTargetAttr(dom, thumbnailNS))?.value;
        if (value) {
            const fileName = this.normalize(value);
            stream = (await this._zip).file(fileName)?.nodeStream();
            if (stream) {
                return { filename: basename(fileName), readable: stream, size: 0, contentType: mimeType(fileName) };
            }
        }

        return undefined;
    }

    /**
     * Sets or updates the thumbnail image of the current AASX package.
     * @param path The name of the thumbnail.
     * @param stream A readable stream.
     */
    public async setThumbnail(path: string, stream: NodeJS.ReadableStream): Promise<void> {
        const zip = await this._zip;
        const dom = await this.getDom('_rels/.rels');
        const attr = await this.getTargetAttr(dom, thumbnailNS);
        if (attr && attr.value) {
            zip.remove(this.normalize(attr.value));
        }

        const fileName = basename(this.normalize(path));
        zip.file(this.normalize(fileName), stream, { compression: 'DEFLATE' });
        await this.setContentType(fileName);
        if (attr) {
            attr.value = fileName;
        } else {
            await this.setTarget(dom, thumbnailNS, fileName);
        }

        zip.file('_rels/.rels', new XMLSerializer().serializeToString(dom), { compression: 'DEFLATE' });
    }

    /**
     * Removes the thumbnail image from the current AASX package.
     */
    public async removeThumbnail(): Promise<void> {
        const zip = await this._zip;
        const dom = await this.getDom('_rels/.rels');
        const attr = await this.getTargetAttr(dom, thumbnailNS);
        if (attr && attr.value) {
            zip.remove(this.normalize(attr.value));
        }

        if (attr) {
            attr.value = '';
        }
    }

    /**
     * Saves the current state of the AASX package.
     */
    public async save(): Promise<void> {
        const zip = await this._zip;
        await new Promise<void>((resolve, reject) => {
            zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true, compression: 'DEFLATE' })
                .pipe(fs.createWriteStream(this.file))
                .on('finish', () => resolve())
                .on('error', error => reject(error));
        });
    }

    private async getDom(path: string): Promise<Document> {
        const xml = await this.getZipEntry(path, 'string');
        return new DOMParser().parseFromString(xml);
    }

    private async load(): Promise<jszip> {
        const data = await fs.promises.readFile(this.file);
        return await jszip.loadAsync(data);
    }

    private async getOriginName(): Promise<string> {
        if (this.originName) {
            return this.originName;
        }

        const dom = await this.getDom('aasx/_rels/aasx-origin.rels');
        const attr = this.relSelect(
            '/openxml:Relationships/openxml:Relationship[@Type="http://admin-shell.io/aasx/relationships/aas-spec" or @Type="http://www.admin-shell.io/aasx/relationships/aas-spec"]/@Target',
            dom,
            true,
        );

        this.originName = xpath.isAttribute(attr) ? attr.value : null;
        if (this.originName === null) {
            throw new Error('Unable to determine origin name.');
        }

        if (this.originName.charAt(0) === '/') {
            this.originName = this.originName.slice(1);
        }

        return this.originName;
    }

    private async getTargetAttr(dom: Document, type: string): Promise<Attr | undefined> {
        const attr = this.relSelect(`/openxml:Relationships/openxml:Relationship[@Type="${type}"]/@Target`, dom, true);
        return xpath.isAttribute(attr) ? attr : undefined;
    }

    private setTarget(dom: Document, type: string, target: string): void {
        const parent = this.relSelect(`/openxml:Relationships`, dom, true);
        if (!xpath.isElement(parent)) {
            throw new Error('Invalid operation.');
        }

        const child = dom.createElement('Relationship');
        child.setAttribute('Type', type);
        child.setAttribute('Target', target);
        parent.appendChild(child);
    }

    private async getZipEntry(path: string, contentType?: jszip.OutputType): Promise<string> {
        if (!contentType) {
            contentType = this.getContentType(basename(path));
        }

        const zip = await this._zip;
        const file = zip.file(path);
        if (file === null) {
            throw new Error(`${path} is not a valid ZIP file.`);
        }

        return (await file.async(contentType)) as string;
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

    private async setContentType(fileName: string): Promise<void> {
        const zip = await this._zip;
        const file = zip.file('[Content_Types].xml');
        if (file === null) {
            throw new Error('[Content_Types].xml is not a valid ZIP file.');
        }

        const dom = new DOMParser().parseFromString((await file.async('string')) as string);
        const index = fileName.lastIndexOf('.');
        const extension = index < 0 ? '' : fileName.substring(index + 1).toLowerCase();
        const nodes = this.contentTypesSelect('/openxml:Types/openxml:Default/@Extension', dom);
        if (Array.isArray(nodes)) {
            for (const node of nodes) {
                if (xpath.isAttribute(node)) {
                    const value = node.value;
                    if (value && extension === value.toLowerCase()) {
                        return;
                    }
                }
            }
        }

        const child = dom.createElement('Default');
        child.setAttribute('Extension', extension);
        child.setAttribute('ContentType', mimeType(fileName));
        const parent = this.contentTypesSelect('/openxml:Types', dom, true);
        if (xpath.isElement(parent)) {
            parent.appendChild(child);
        }

        zip.file('[Content_Types].xml', new XMLSerializer().serializeToString(dom), { compression: 'DEFLATE' });
    }

    private getExtension(fileName: string): string {
        const index = fileName.lastIndexOf('.');
        return index >= 0 ? fileName.substring(index).toLowerCase() : '';
    }

    private normalize(path: string): string {
        path = path.replace(/\\/g, '/');
        if (path.charAt(0) === '/') {
            path = path.slice(1);
        } else if (path.startsWith('./')) {
            path = path.slice(2);
        }

        return path;
    }
}
