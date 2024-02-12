/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { FileStat, WebDAVClient, createClient } from 'webdav';
import { join, normalize, sep } from 'path/posix';
import { FileStorage, FileStorageEntry } from './file-storage.js';

export class WebDAVStorage extends FileStorage {
    private url: URL;

    public constructor(
        url: string | URL,
        private _client?: WebDAVClient,
    ) {
        url = typeof url === 'string' ? new URL(url) : url;
        super(url.pathname);

        this.url = url;
    }

    public async mtime(path: string): Promise<Date> {
        const stat = (await this.client.stat(this.resolve(path))) as FileStat;
        return new Date(stat.lastmod);
    }

    public exists(path: string): Promise<boolean> {
        return this.client.exists(this.resolve(path));
    }

    public override createDir(path: string, recursive?: boolean | undefined): Promise<void> {
        return this.client.createDirectory(this.resolve(path), { recursive });
    }

    public async writeFile(path: string, data: string | Buffer): Promise<void> {
        await this.client.putFileContents(this.resolve(path), data, { overwrite: true });
    }

    public async readDir(path: string): Promise<FileStorageEntry[]> {
        const items = (await this.client.getDirectoryContents(this.resolve(path))) as FileStat[];
        return items.map(item => ({ name: item.basename, path: item.filename, type: item.type }));
    }

    public async readFile(path: string): Promise<Buffer> {
        const contents = await this.client.getFileContents(this.resolve(path));
        if (typeof contents === 'string') {
            return Buffer.from(contents);
        }

        return contents as Buffer;
    }

    public async delete(path: string): Promise<void> {
        return this.client.deleteFile(this.resolve(path));
    }

    public override createReadStream(path: string): NodeJS.ReadableStream {
        return this.client.createReadStream(this.resolve(path));
    }

    private get client(): WebDAVClient {
        if (!this._client) {
            const url = new URL(this.url);
            url.pathname = '/remote.php/webdav';
            const username = url.username;
            const password = url.password;
            url.username = '';
            url.password = '';

            this._client = createClient(url.href, {
                username: username,
                password: password,
            });
        }

        return this._client;
    }

    private resolve(path: string): string {
        path = normalize(path);
        if (path.startsWith(sep)) {
            path = path.substring(1);
        }

        return join(this.root, path);
    }
}
