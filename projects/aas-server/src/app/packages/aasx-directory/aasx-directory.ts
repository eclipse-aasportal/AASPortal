/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, ApplicationError } from 'common';
import { join } from 'path';
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
        url: string,
        name: string,
        private readonly fileStorage: FileStorage,
    ) {
        super(logger, url, name);

        this.root = new URL(url).pathname;
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
        return (await this.fileStorage.readDir(this.root))
            .filter(entry => entry.type === 'file')
            .map(entry => entry.name);
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

    public createPackage(address: string): AASPackage {
        return new AasxPackage(this.logger, this, address);
    }

    public override createSubscription(): SocketSubscription {
        throw new Error('Not implemented.');
    }

    public async getPackageAsync(_: string, name: string): Promise<NodeJS.ReadableStream> {
        const path = join(this.root, name);
        if (!(await this.fileStorage.exists(path))) {
            throw new Error(`The file '${path}' does not exist.`);
        }

        return this.fileStorage.createReadStream(path);
    }

    public readEnvironmentAsync(): Promise<aas.Environment> {
        throw new Error('Not implemented.');
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
}
