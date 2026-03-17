/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import { basename } from 'path/posix';
import jszip from 'jszip';
import xpath from 'xpath';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { extensionToMimeType } from 'aas-core';

import { FileResult } from './types.js';

const thumbnailNS = 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail';

/**
 * Represents an AASX (Asset Administration Shell) package file.
 * This abstract class provides functionality to handle AASX files, which are ZIP-based archives
 * containing AAS (Asset Administration Shell) environments and related resources.
 *
 * The class supports operations such as:
 * - Reading and writing files within the AASX package
 * - Handling the thumbnail
 * - Saving and manipulating the AASX package
 *
 * @abstract
 * @class
 *
 * @property {jszip} zip - The underlying ZIP archive containing the AASX package
 * @property {string | undefined} file - The file path of the AASX package
 */
export abstract class AasxFile {
    private originName: string | null = null;
    private relationshipsSelect: xpath.XPathSelect;
    private contentTypesSelect: xpath.XPathSelect;

    protected constructor(
        public readonly zip: jszip,
        private file?: string,
    ) {
        this.zip = zip;

        this.relationshipsSelect = xpath.useNamespaces({
            openxml: 'http://schemas.openxmlformats.org/package/2006/relationships',
        });

        this.contentTypesSelect = xpath.useNamespaces({
            openxml: 'http://schemas.openxmlformats.org/package/2006/content-types',
        });
    }

    public contains(path: string): boolean {
        return this.zip.filter(relativePath => relativePath === path).length > 0;
    }

    /**
     * Gets the path of the file in the zip archive that contains the AAS environment.
     * @returns The path to the AAS environment file.
     *
     * @throws If the archive does not contain an AAS environment file.
     */
    public async getOriginName(): Promise<string> {
        if (this.originName) {
            return this.originName;
        }

        const dom = await this.getDom('aasx/_rels/aasx-origin.rels');
        const attr = this.relationshipsSelect(
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

    /**
     * Reads the file that has a relationship to a File element.
     * @param path The file path.
     * @returns A readable stream.
     */
    public read(path: string): NodeJS.ReadableStream {
        const stream = this.zip.file(this.normalize(path))?.nodeStream() as NodeJS.ReadableStream | undefined;
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
        this.zip.file(this.normalize(path), stream, { compression: 'DEFLATE' });
        await this.setContentType(path);
    }

    /**
     * Removes a file with the specified path from the AASX package.
     * @param path The path of the file to remove.
     */
    public remove(path: string): void {
        this.zip.remove(this.normalize(path));
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
     * Saves the AASX file to the specified location or to the current file path if no path is provided.
     * The file is saved using ZIP compression (DEFLATE).
     *
     * @param file - Optional. The file path where to save the AASX file. If not provided, uses the current file path.
     * @throws {Error} When no destination file is specified (neither as parameter nor as current file path).
     * @returns Promise that resolves when the file has been saved successfully.
     */
    public async save(file?: string): Promise<void> {
        file = file ?? this.file;
        if (!file) {
            throw new Error('No destination file specified.');
        }

        await new Promise<void>((resolve, reject) => {
            this.zip
                .generateNodeStream({ type: 'nodebuffer', streamFiles: true, compression: 'DEFLATE' })
                .pipe(fs.createWriteStream(file))
                .on('finish', () => resolve())
                .on('error', error => reject(error));
        });

        this.file = file;
    }

    /**
     * Sets the thumbnail image for the AASX package.
     *
     * This method handles updating or creating a new thumbnail in the package:
     * 1. Removes existing thumbnail if present
     * 2. Adds new thumbnail file from provided stream
     * 3. Updates content type mapping
     *
     * @param path - The file path for the new thumbnail
     * @param stream - The readable stream containing the thumbnail image data
     * @returns Promise that resolves when thumbnail is successfully set
     * @throws Error if updating package relationships or content types fails
     */
    public async setThumbnail(path: string, stream: NodeJS.ReadableStream): Promise<void> {
        const dom = await this.getDom('_rels/.rels');
        const attr = await this.getTargetAttr(dom, thumbnailNS);
        if (attr && attr.value) {
            this.zip.remove(this.normalize(attr.value));
        }

        const fileName = basename(this.normalize(path));
        this.zip.file(this.normalize(fileName), stream, { compression: 'DEFLATE' });
        await this.setContentType(fileName);
        if (attr) {
            attr.value = fileName;
        } else {
            await this.setTarget(dom, thumbnailNS, fileName);
        }

        this.zip.file('_rels/.rels', new XMLSerializer().serializeToString(dom), { compression: 'DEFLATE' });
    }

    /**
     * Removes the thumbnail from the AASX file.
     * This method performs two operations:
     * 1. Removes the actual thumbnail file from the zip archive
     * 2. Clears the thumbnail reference in the relationships file
     *
     * @returns A Promise that resolves when the thumbnail has been removed
     * @throws May throw an error if there are issues accessing the zip file or relationship document
     */
    public async removeThumbnail(): Promise<void> {
        const dom = await this.getDom('_rels/.rels');
        const attr = await this.getTargetAttr(dom, thumbnailNS);
        if (attr && attr.value) {
            this.zip.remove(this.normalize(attr.value));
        }

        if (attr) {
            attr.value = '';
            this.zip.file('_rels/.rels', new XMLSerializer().serializeToString(dom), { compression: 'DEFLATE' });
        }
    }

    /**
     * Creates a jszip instance from either a file path or a buffer.
     * @param arg - The input which can be either a file path (string) or a buffer
     * @returns A Promise that resolves to a jszip instance
     * @throws {Error} If file reading operations fail
     */
    protected static async createZip(arg: string | Buffer<ArrayBufferLike>): Promise<jszip> {
        if (typeof arg === 'string') {
            if (fs.existsSync(arg)) {
                const data = await fs.promises.readFile(arg);
                return await jszip.loadAsync(data);
            } else {
                return new jszip();
            }
        }

        return await jszip.loadAsync(arg);
    }

    /**
     * Returns the thumbnail image of the current AASX package.
     * @returns The thumbnail image or `undefined`.
     */
    protected async getPackageThumbnail(): Promise<FileResult | undefined> {
        let readable: NodeJS.ReadableStream | undefined;
        const dom = await this.getDom('_rels/.rels');
        const value = (await this.getTargetAttr(dom, thumbnailNS))?.value;
        if (value) {
            const filename = this.normalize(value);
            readable = (await this.zip.file(filename)?.nodeStream()) as NodeJS.ReadableStream | undefined;
            if (readable) {
                return {
                    filename: basename(filename),
                    value,
                    readable,
                    contentType: extensionToMimeType(filename),
                };
            }
        }

        return undefined;
    }

    /**
     * Retrieves and processes an entry from the ZIP file.
     * @param path - The path to the file within the ZIP archive
     * @param contentType `string`
     * @returns Promise resolving to the file content of type `string`
     * @throws Error if the specified path does not exist in the ZIP file
     */
    protected async getZipEntry(path: string, contentType: 'string'): Promise<string>;
    /**
     * Retrieves and processes an entry from the ZIP file.
     * @param path - The path to the file within the ZIP archive
     * @param contentType - Optional parameter to specify the desired output type of the ZIP entry content
     * @returns Promise resolving to the file content in the specified format
     * @throws Error if the specified path does not exist in the ZIP file
     */
    protected async getZipEntry(
        path: string,
        contentType?: jszip.OutputType,
    ): Promise<string | ArrayBuffer | Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike> | number[] | Blob> {
        if (!contentType) {
            contentType = this.getContentType(basename(path));
        }

        const file = this.zip.file(path);
        if (file === null) {
            throw new Error(`${path} is not a valid ZIP file.`);
        }

        return await file.async(contentType);
    }

    private async getDom(path: string): Promise<Document> {
        const xml = await this.getZipEntry(path, 'string');
        return new DOMParser().parseFromString(xml);
    }

    private async getTargetAttr(dom: Document, type: string): Promise<Attr | undefined> {
        const attr = this.relationshipsSelect(
            `/openxml:Relationships/openxml:Relationship[@Type="${type}"]/@Target`,
            dom,
            true,
        );
        return xpath.isAttribute(attr) ? attr : undefined;
    }

    private setTarget(dom: Document, type: string, target: string): void {
        const parent = this.relationshipsSelect(`/openxml:Relationships`, dom, true);
        if (!xpath.isElement(parent)) {
            throw new Error('Invalid operation.');
        }

        const child = dom.createElement('Relationship');
        child.setAttribute('Type', type);
        child.setAttribute('Target', target);
        parent.appendChild(child);
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
        const file = this.zip.file('[Content_Types].xml');
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
        child.setAttribute('ContentType', extensionToMimeType(fileName) ?? '');
        const parent = this.contentTypesSelect('/openxml:Types', dom, true);
        if (xpath.isElement(parent)) {
            parent.appendChild(child);
        }

        this.zip.file('[Content_Types].xml', new XMLSerializer().serializeToString(dom), { compression: 'DEFLATE' });
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
