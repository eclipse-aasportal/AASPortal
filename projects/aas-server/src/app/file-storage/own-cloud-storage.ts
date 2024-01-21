/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { FileStorage } from './file-storage.js';
import ownCloud, { OwnCloudOptions } from 'owncloud-sdk';

export class OwnCloudStorage extends FileStorage {
    private promise: Promise<string>;
    private oc: ownCloud;

    public constructor(arg: string | URL) {
        super();

        const url = typeof arg === 'string' ? new URL(arg) : arg;
        const username = url.username;
        const password = url.password;
        url.username = '';
        url.password = '';

        const options: OwnCloudOptions = {
            baseUrl: url.href,
        };

        if (username && password) {
            options.auth = { basic: { username, password } };
        }

        this.oc = new ownCloud(options);
        this.promise = this.oc.login();
    }

    public readonly root: string = '/';

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public mtime(path: string): Promise<Date> {
        throw new Error('Method not implemented.');
    }

    public async exists(path: string): Promise<boolean> {
        await this.promise;
        const fileInfo = await this.oc.files.fileInfo(path, {});
        return fileInfo != null;
    }

    public async isDirectory(path: string): Promise<boolean> {
        await this.promise;
        const fileInfo = await this.oc.files.fileInfo(path, {});
        return fileInfo.isDir();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public mkdir(path: string, recursive?: boolean | undefined): Promise<string | undefined> {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public writeFile(path: string, data: string | Buffer): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async readDir(path: string): Promise<string[]> {
        await this.promise;
        const fileInfo = await this.oc.files.fileInfo(path, {});
        console.log(fileInfo?.isDir);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public readFile(path: string): Promise<Buffer> {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public unlink(path: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public override rename(oldPath: string, newPath: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public createReadStream(path: string): NodeJS.ReadableStream {
        throw new Error('Method not implemented.');
    }
}
