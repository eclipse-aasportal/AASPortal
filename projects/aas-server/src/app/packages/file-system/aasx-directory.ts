/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, ApplicationError } from 'common';
import { basename, extname, join } from 'path/posix';
import { readFile } from 'fs/promises';
import { ERRORS } from '../../errors.js';
import { FileStorage } from '../../file-storage/file-storage.js';
import { Logger } from '../../logging/logger.js';
import { AASPackage } from '../aas-package.js';
import { AASResource } from '../aas-resource.js';
import { AasxPackage } from './aasx-package.js';
import { SocketSubscription } from '../../live/socket-subscription.js';

export class AasxDirectory extends AASResource {
    private readonly root: string;
    private reentry = 0;

    public constructor(
        logger: Logger,
        private readonly fileStorage: FileStorage,
        name?: string,
    ) {
        super(logger, fileStorage.url, name ?? basename(fileStorage.url));

        this.root = new URL(fileStorage.url).pathname;
    }

    public get isOpen(): boolean {
        return this.reentry > 0;
    }

    public override readonly version = '';

    public readonly readOnly = true;

    public readonly onlineReady = false;

    public readFile(name: string): Promise<Buffer> {
        return this.fileStorage.readFile(join(this.root, name));
    }

    public async readDir(): Promise<string[]> {
        const files: string[] = [];
        await this.readDirectoryAsync(this.root, '', files);
        return files;
    }

    public async testAsync(): Promise<void> {
        if (this.reentry === 0) {
            try {
                await this.openAsync();
            } finally {
                await this.closeAsync();
            }
        }
    }

    public async openAsync(): Promise<void> {
        if (this.reentry === 0) {
            if (!(await this.fileStorage.exists(this.root))) {
                throw new Error(`The directory '${this.url}' does not exist.`);
            }

            ++this.reentry;
        }
    }

    public closeAsync(): Promise<void> {
        return new Promise(resolve => {
            if (this.reentry > 0) {
                --this.reentry;
            }

            resolve();
        });
    }

    public override createPackage(address: string): AASPackage {
        return new AasxPackage(this.logger, this, address);
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

    private async readDirectoryAsync(dir: string, path: string, files: string[]): Promise<void> {
        const entries = await this.fileStorage.readDir(dir);
        for (const entry of entries) {
            if (entry.type === 'directory') {
                await this.readDirectoryAsync(join(dir, entry.name), join(path, entry.name), files);
            } else if (extname(entry.name) === '.aasx') {
                files.push(join(path, entry.name));
            }
        }
    }
}
