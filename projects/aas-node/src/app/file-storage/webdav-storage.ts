/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { FileStat, WebDAVClient, createClient } from 'webdav';
import { dirname, join, normalize, relative, sep } from 'path/posix';
import { FileStorage, FileStorageEntry } from './file-storage.js';

export class WebDAVStorage extends FileStorage {
    private client: WebDAVClient;

    public constructor(url: string | URL, client?: WebDAVClient) {
        url = typeof url === 'string' ? new URL(url) : url;
        super(sep);

        this.url = typeof url === 'string' ? url : url.href;
        this.client = client || this.createClient();
    }

    public override readonly url: string;

    public override async mtime(path: string): Promise<Date> {
        const stat = (await this.client.stat(this.resolve(path))) as FileStat;
        return new Date(stat.lastmod);
    }

    public override exists(path: string): Promise<boolean> {
        return this.client.exists(this.resolve(path));
    }

    public override createDir(path: string, recursive?: boolean | undefined): Promise<void> {
        return this.client.createDirectory(this.resolve(path), { recursive });
    }

    public override async writeFile(path: string, data: string | Buffer): Promise<void> {
        await this.client.putFileContents(this.resolve(path), data, { overwrite: true });
    }

    public override async readDir(path: string): Promise<FileStorageEntry[]> {
        const items = (await this.client.getDirectoryContents(this.resolve(path))) as FileStat[];
        return items.map(item => ({
            name: item.basename,
            path: sep + relative(this.root, dirname(item.filename)),
            type: item.type,
        }));
    }

    public override async readFile(path: string): Promise<Buffer> {
        const contents = await this.client.getFileContents(this.resolve(path));
        if (typeof contents === 'string') {
            return Buffer.from(contents);
        }

        return contents as Buffer;
    }

    public override delete(path: string): Promise<void> {
        return this.client.deleteFile(this.resolve(path));
    }

    public override createReadStream(path: string): NodeJS.ReadableStream {
        return this.client.createReadStream(this.resolve(path));
    }

    private createClient(): WebDAVClient {
        const url = new URL(this.url);
        url.pathname = '/remote.php/webdav';
        const username = url.username;
        const password = url.password;
        url.username = '';
        url.password = '';

        return createClient(url.href, {
            username: username,
            password: password,
        });
    }

    private resolve(path: string): string {
        path = normalize(path);
        if (path.startsWith(sep)) {
            path = path.substring(1);
        }

        return join(this.root, path);
    }
}
