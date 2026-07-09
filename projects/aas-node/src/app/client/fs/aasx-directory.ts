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
import { aas, AASDocument, AASEndpoint, ApplicationError, noop, normalize, PagedResult } from 'aas-core';
import { Logger } from 'aas-package';
import { ERRORS } from '../../errors.js';
import { FileStorage } from '../../file-storage/file-storage.js';
import { EndpointClient } from '../endpoint-client.js';
import { AasxPackage } from './aasx-package.js';
import { SocketSubscription } from '../../live/socket-subscription.js';

/**
 * Provides a file system based endpoint.
 */
export class AasxDirectory extends EndpointClient {
    private readonly root: string;
    private reentry = 0;

    public constructor(
        logger: Logger,
        endpoint: AASEndpoint,
        private readonly fileStorage: FileStorage,
    ) {
        const url = new URL(endpoint.url);
        super(logger, endpoint);

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

    public override async getDocuments(
        cursor: string | undefined,
        limit: number = 100,
    ): Promise<PagedResult<AASDocument>> {
        noop(cursor);
        const files: string[] = [];
        await this.readDir(this.root, '', files);
        const index = cursor ? Number(JSON.parse(cursor)) : 0;
        const end = index + limit;
        const result = await Promise.allSettled(files.slice(index, end).map(file => this.createDocument(file)));

        return {
            result: result.filter(item => item.status === 'fulfilled').map(item => item.value),
            paging_metadata: end < files.length ? { cursor: JSON.stringify(end) } : {},
        };
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

    private async readDir(dir: string, path: string, files: string[]): Promise<void> {
        const entries = await this.fileStorage.readDir(dir);
        for (const entry of entries) {
            if (entry.type === 'directory') {
                await this.readDir(posix.join(dir, entry.name), posix.join(path, entry.name), files);
            } else if (posix.extname(entry.name) === '.aasx') {
                files.push(posix.join(path, entry.name));
            }
        }
    }

    private async openAasxPackage(filename: string): Promise<AasxPackage> {
        const buffer = await this.fileStorage.readFile(posix.join(this.root, filename));
        return await AasxPackage.createFromBuffer(buffer);
    }
}
