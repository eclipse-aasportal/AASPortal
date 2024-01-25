/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { noop } from 'lodash-es';
import { FileStorage } from './file-storage.js';
import ownCloud, { OwnCloudOptions } from 'owncloud-sdk';

export class OwnCloudStorage extends FileStorage {
    private oc: ownCloud;
    private connected = false;

    public constructor(arg: string | URL, root: string) {
        super(root);

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
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public mtime(path: string): Promise<Date> {
        throw new Error('Method not implemented.');
    }

    public async exists(path: string): Promise<boolean> {
        await this.ensureConnected();
        const fileInfo = await this.oc.files.fileInfo(this.join(this.root, path), ['{http://owncloud.org/ns}fileid']);
        return fileInfo != null;
    }

    public async isDirectory(path: string): Promise<boolean> {
        await this.ensureConnected();
        const fileInfo = await this.oc.files.fileInfo(this.join(this.root, path), ['{http://owncloud.org/ns}fileid']);
        return fileInfo.isDir();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async mkdir(path: string, recursive?: boolean | undefined): Promise<string | undefined> {
        await this.ensureConnected();

        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async writeFile(path: string, data: string | Buffer): Promise<void> {
        await this.ensureConnected();

        throw new Error('Method not implemented.');
    }

    public async readDir(path: string): Promise<string[]> {
        await this.ensureConnected();
        const items = await this.oc.files.list(this.join(this.root, path));
        return items.map(item => item.name);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async readFile(path: string): Promise<Buffer> {
        await this.ensureConnected();

        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async unlink(path: string): Promise<void> {
        await this.ensureConnected();

        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public override async rename(oldPath: string, newPath: string): Promise<void> {
        await this.ensureConnected();

        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public override createReadStream(path: string): NodeJS.ReadableStream {
        throw new Error('Method not implemented.');
    }

    private join(...args: string[]): string {
        let path = '';
        for (const arg of args) {
            if (arg.endsWith('/')) {
                path += arg.startsWith('/') ? arg.substring(1) : arg;
            } else {
                path += arg.startsWith('/') ? arg : '/' + arg;
            }
        }

        return path;
    }

    private async ensureConnected(): Promise<void> {
        if (!this.connected) {
            try {
                await this.oc.login();
                this.connected = true;
            } catch {
                noop();
            }
        }
    }
}
