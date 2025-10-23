/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASEndpoint, ApplicationError, noop, normalize, PagedResult } from 'aas-core';
import { extname, join } from 'path/posix';
import { readFile } from 'fs/promises';
import { ERRORS } from '../../errors.js';
import { FileStorage } from '../../file-storage/file-storage.js';
import { Logger } from '../../logging/logger.js';
import { AASClient } from '../aas-client.js';
import { AasxPackage } from './aasx-package.js';
import { SocketSubscription } from '../../live/socket-subscription.js';

/** Provides a file system based endpoint. */
export class AasxDirectory extends AASClient {
    private readonly root: string;
    private reentry = 0;

    public constructor(
        logger: Logger,
        private readonly fileStorage: FileStorage,
        endpoint: AASEndpoint,
    ) {
        const url = new URL(endpoint.url);
        super(logger, endpoint);

        this.root = url.pathname;
    }

    public get isOpen(): boolean {
        return this.reentry > 0;
    }

    public readonly readOnly = false;

    public readonly onlineReady = false;

    public async getFiles(cursor?: string): Promise<PagedResult<string>> {
        noop(cursor);
        const files: string[] = [];
        await this.readDirAsync(this.root, '', files);
        return { result: files, paging_metadata: {} };
    }

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

    public close(): Promise<void> {
        return new Promise(resolve => {
            if (this.reentry > 0) {
                --this.reentry;
            }

            resolve();
        });
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

    public override async openRead(filename: string, file: aas.File): Promise<NodeJS.ReadableStream> {
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

    public override createSubscription(): SocketSubscription {
        throw new Error('Not implemented.');
    }

    public override async getPackage(_: string, name: string): Promise<NodeJS.ReadableStream> {
        const path = join(this.root, name);
        if (!(await this.fileStorage.exists(path))) {
            throw new Error(`The file '${path}' does not exist.`);
        }

        return this.fileStorage.createReadStream(path);
    }

    public override async insertPackage(file: Express.Multer.File): Promise<string> {
        const path = join(this.root, file.filename);
        const exists = await this.fileStorage.exists(path);
        if (exists) {
            throw new ApplicationError(ERRORS.FileAlreadyExists, { file: file.fieldname }, 409);
        }

        try {
            const buffer = await readFile(file.path);
            await this.fileStorage.writeFile(path, buffer);
            return `${file.filename} successfully written`;
        } catch (error) {
            if (await this.fileStorage.exists(path)) {
                await this.fileStorage.delete(path);
            }

            throw error;
        }
    }

    public override async deletePackage(_: string, name: string): Promise<string> {
        const path = join(this.root, name);
        await this.fileStorage.delete(path);
        return `${path} successfully deleted`;
    }

    public override invoke(): Promise<aas.Operation> {
        throw new Error('Not implemented.');
    }

    public override getBlobValue(): Promise<string | undefined> {
        throw new Error('Not implemented.');
    }

    private async readDirAsync(dir: string, path: string, files: string[]): Promise<void> {
        const entries = await this.fileStorage.readDir(dir);
        for (const entry of entries) {
            if (entry.type === 'directory') {
                await this.readDirAsync(join(dir, entry.name), join(path, entry.name), files);
            } else if (extname(entry.name) === '.aasx') {
                files.push(join(path, entry.name));
            }
        }
    }

    private async openAasxPackage(filename: string): Promise<AasxPackage> {
        const buffer = await this.fileStorage.readFile(join(this.root, filename));
        return await AasxPackage.createFromBuffer(buffer);
    }
}
