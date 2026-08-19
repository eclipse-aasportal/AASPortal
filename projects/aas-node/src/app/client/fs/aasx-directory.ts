/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { basename } from 'path';
import * as posix from 'path/posix';
import { readFile } from 'fs/promises';
import {
    aas,
    AASDocument,
    AASEndpoint,
    ApplicationError,
    convertToString,
    normalize,
    PagedResult,
    PagingMetadata,
} from 'aas-core';

import { Logger } from 'aas-package';
import { ERRORS } from '../../errors.js';
import { FileStorage } from '../../file-storage/file-storage.js';
import { EndpointClient } from '../endpoint-client.js';
import { AasxPackage } from './aasx-package.js';
import { SocketSubscription } from '../../live/socket-subscription.js';
import { AASIndexClient } from '../../index/aas-index-client.js';

/**
 * Provides a file system based endpoint.
 */
export class AasxDirectory extends EndpointClient {
    private readonly root: string;
    private reentry = 0;

    public constructor(
        logger: Logger,
        index: AASIndexClient,
        endpoint: AASEndpoint,
        private readonly fileStorage: FileStorage,
    ) {
        const url = new URL(endpoint.url);
        super(logger, index, endpoint);

        this.root = url.pathname;
    }

    public get isOpen(): boolean {
        return this.reentry > 0;
    }

    public readonly readOnly = false;

    public readonly providesLiveData = false;

    public async test(): Promise<void> {
        if (this.reentry === 0) {
            try {
                await this.open();
            } finally {
                await this.close();
            }
        }
    }

    public async open(): Promise<void> {
        if (this.reentry === 0) {
            if (!(await this.fileStorage.exists(this.root))) {
                throw new Error(`The endpoint ${this.endpoint.name} (${this.endpoint.url}) does not exist.`);
            }

            ++this.reentry;
        }
    }

    public async close(): Promise<void> {
        await new Promise<void>(resolve => {
            if (this.reentry > 0) {
                --this.reentry;
            }

            resolve();
        });
    }

    public override async hasDocument(filename: string): Promise<boolean> {
        return this.fileStorage.exists(posix.join(this.root, filename));
    }

    public override async getDocuments(cursor: string | undefined, limit?: number): Promise<PagedResult<AASDocument>> {
        const index = cursor ? Number(JSON.parse(cursor)) : 0;
        const result: AASDocument[] = [];
        let current = 0;
        const paging_metadata: PagingMetadata = {};
        for await (const file of this.readDir(this.root, '')) {
            if (current++ < index) {
                continue;
            }

            if (limit !== undefined && result.length >= limit) {
                paging_metadata.cursor = JSON.stringify(current - 1);
                break;
            }

            try {
                result.push(await this.getDocument(file));
            } catch (error) {
                this.logger.warning(`Reading AAS document from file ${file} failed: ${convertToString(error)}`);
            }
        }

        return {
            result,
            paging_metadata,
        };
    }

    public override async getSubmodels(cursor: string | undefined, limit?: number): Promise<PagedResult<aas.Submodel>> {
        const result: aas.Submodel[] = [];
        const index = cursor ? Number(JSON.parse(cursor)) : 0;
        const paging_metadata: PagingMetadata = {};
        let current = 0;
        for await (const file of this.readDir(this.root, '')) {
            if (current++ < index) {
                continue;
            }

            if (limit !== undefined && result.length >= limit) {
                paging_metadata.cursor = JSON.stringify(current - 1);
                break;
            }

            const env = await this.getEnvironment(file);
            if (!env.submodels) {
                continue;
            }

            result.push(...env.submodels);
        }

        return { result, paging_metadata };
    }

    public override async getConceptDescriptions(
        cursor: string | undefined,
        limit?: number,
    ): Promise<PagedResult<aas.ConceptDescription>> {
        const result: aas.ConceptDescription[] = [];
        const index = cursor ? Number(JSON.parse(cursor)) : 0;
        const paging_metadata: PagingMetadata = {};
        let current = 0;
        for await (const file of this.readDir(this.root, '')) {
            if (current++ < index) {
                continue;
            }

            if (limit !== undefined && result.length >= limit) {
                paging_metadata.cursor = JSON.stringify(current - 1);
                break;
            }

            const env = await this.getEnvironment(file);
            if (!env.conceptDescriptions) {
                continue;
            }

            result.push(...env.conceptDescriptions);
        }

        return { result, paging_metadata };
    }

    public override async getThumbnail(filename: string): Promise<NodeJS.ReadableStream | undefined> {
        const aasxPackage = await this.openAasxPackage(filename);
        return await aasxPackage.getThumbnail();
    }

    public override async getEnvironment(filename: string): Promise<aas.Environment> {
        const aasxPackage = await this.openAasxPackage(filename);
        return await aasxPackage.getEnvironment();
    }

    public override async setEnvironment(filename: string, env: aas.Environment): Promise<void> {
        (await this.openAasxPackage(filename)).setEnvironment(env);
    }

    public override async getFile(filename: string, file: aas.File): Promise<NodeJS.ReadableStream> {
        if (!file.value) {
            throw new Error('Invalid empty file.value.');
        }

        const aasxPackage = await this.openAasxPackage(filename);
        const name = normalize(file.value);
        const stream = (await aasxPackage.zip).file(name)?.nodeStream();
        if (!stream) {
            throw Error(`ZIP entry '${name}' could not be opened.`);
        }

        return stream;
    }

    public override async determineAddress(aasxFile: string): Promise<string | undefined> {
        return await Promise.resolve(basename(aasxFile));
    }

    public override createSubscription(): SocketSubscription {
        throw new Error('Not implemented.');
    }

    public override async getPackage(_: string, name: string): Promise<NodeJS.ReadableStream> {
        const path = posix.join(this.root, name);
        if (!(await this.fileStorage.exists(path))) {
            throw new Error(`The file '${path}' does not exist.`);
        }

        return this.fileStorage.createReadStream(path);
    }

    public override async insertPackage(file: string): Promise<void> {
        const filename = basename(file);
        const path = posix.join(this.root, filename);
        const exists = await this.fileStorage.exists(path);
        if (exists) {
            throw new ApplicationError(ERRORS.FILE_ALREADY_EXISTS, { file: filename }, 409);
        }

        try {
            const buffer = await readFile(file);
            await this.fileStorage.writeFile(path, buffer);
        } catch (error) {
            if (await this.fileStorage.exists(path)) {
                await this.fileStorage.delete(path);
            }

            throw error;
        }
    }

    public override async deletePackage(_: string, name: string): Promise<void> {
        const path = posix.join(this.root, name);
        await this.fileStorage.delete(path);
    }

    public override invoke(): Promise<aas.Operation> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public override getBlobValue(): Promise<string | undefined> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public override getAllAssetAdministrationShellIdsByAssetLink(): Promise<PagedResult<string>> {
        return Promise.reject(new Error('Not implemented.'));
    }

    private async *readDir(dir: string, path: string): AsyncIterable<string> {
        const entries = await this.fileStorage.readDir(dir);
        for (const entry of entries) {
            if (entry.type === 'directory') {
                yield* this.readDir(posix.join(dir, entry.name), posix.join(path, entry.name));
            } else if (posix.extname(entry.name) === '.aasx') {
                yield posix.join(path, entry.name);
            }
        }
    }

    private async openAasxPackage(filename: string): Promise<AasxPackage> {
        const buffer = await this.fileStorage.readFile(posix.join(this.root, filename));
        return await AasxPackage.createFromBuffer(buffer);
    }
}
