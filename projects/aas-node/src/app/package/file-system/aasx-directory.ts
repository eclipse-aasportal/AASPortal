/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASEndpoint, ApplicationError, noop } from 'aas-core';
import { extname, join } from 'path/posix';
import { readFile } from 'fs/promises';
import { ERRORS } from '../../errors.js';
import { FileStorage } from '../../file-storage/file-storage.js';
import { Logger } from '../../logging/logger.js';
import { AASPackage } from '../aas-package.js';
import { AASClient } from '../aas-client.js';
import { AasxPackage } from './aasx-package.js';
import { SocketSubscription } from '../../live/socket-subscription.js';
import { PagedResult } from '../../types/paged-result.js';

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

    public readFile(name: string): Promise<Buffer> {
        return this.fileStorage.readFile(join(this.root, name));
    }

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
                throw new Error(`The directory '${this.endpoint}' does not exist.`);
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

    public override createPackage(...args: string[]): AASPackage {
        return new AasxPackage(this.logger, this, args[0]);
    }

    public override createSubscription(): SocketSubscription {
        throw new Error('Not implemented.');
    }

    public override async getPackageAsync(_: string, name: string): Promise<NodeJS.ReadableStream> {
        const path = join(this.root, name);
        if (!(await this.fileStorage.exists(path))) {
            throw new Error(`The file '${path}' does not exist.`);
        }

        return this.fileStorage.createReadStream(path);
    }

    public override async postPackageAsync(file: Express.Multer.File): Promise<string> {
        const path = join(this.root, file.filename);
        const exists = await this.fileStorage.exists(path);
        if (exists) {
            throw new ApplicationError(
                `A file with the name '${path}' already exists.`,
                ERRORS.FileAlreadyExists,
                file.filename,
            );
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

    public override async deletePackageAsync(_: string, name: string): Promise<string> {
        const path = join(this.root, name);
        await this.fileStorage.delete(path);
        return `${path} successfully deleted`;
    }

    public override invoke(): Promise<aas.Operation> {
        throw new Error('Not implemented.');
    }

    public override getBlobValueAsync(): Promise<string | undefined> {
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
}
