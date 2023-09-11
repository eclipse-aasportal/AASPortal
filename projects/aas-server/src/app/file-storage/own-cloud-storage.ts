/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { FileStorage } from './file-storage.js';
import ownCloud, { OwnCloudOptions } from 'owncloud-sdk';

export class OwnCloudStorage extends FileStorage {

    public readonly root: string = '/';

    public async connect(url: string): Promise<void> {
        const temp = new URL(url);
        const username = temp.username;
        const password = temp.password;
        temp.username = '';
        temp.password = '';

        const options: OwnCloudOptions = {
            baseUrl: temp.href
        }

        if (username && password) {
            options.auth = { basic: { username, password } };
        }

        const oc = new ownCloud(options);

        await oc.login();
    }

    public mtime(path: string): Promise<Date> {
        throw new Error('Method not implemented.');
    }

    public exists(path: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    public isDirectory(path: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    public mkdir(path: string, recursive?: boolean | undefined): Promise<string | undefined> {
        throw new Error('Method not implemented.');
    }

    public writeFile(path: string, data: string | Buffer): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public readdir(path: string): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    public readFile(path: string): Promise<Buffer> {
        throw new Error('Method not implemented.');
    }

    public unlink(path: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public rename(oldPath: string, newPath: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public createReadStream(path: string): NodeJS.ReadableStream {
        throw new Error('Method not implemented.');
    }
}