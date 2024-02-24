/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import { normalize, resolve, sep } from 'path/posix';
import { FileStorage, FileStorageEntry } from './file-storage.js';

export class LocalFileStorage extends FileStorage {
    public constructor(root: string) {
        super(resolve(root));
    }

    public async mtime(path: string): Promise<Date> {
        return (await fs.promises.stat(resolve(this.root, path))).mtime;
    }

    public exists(path: string): Promise<boolean> {
        return Promise.resolve(fs.existsSync(this.resolve(path)));
    }

    public override async createDir(path: string, recursive = false): Promise<void> {
        await fs.promises.mkdir(this.resolve(path), { recursive: recursive });
    }

    public writeFile(path: string, data: string | Buffer): Promise<void> {
        return fs.promises.writeFile(this.resolve(path), data);
    }

    public async readDir(path: string): Promise<FileStorageEntry[]> {
        return (await fs.promises.readdir(this.resolve(path), { withFileTypes: true })).map(entry => ({
            name: entry.name,
            path: entry.path,
            type: entry.isDirectory() ? 'directory' : 'file',
        }));
    }

    public readFile(path: string): Promise<Buffer> {
        return fs.promises.readFile(this.resolve(path));
    }

    public delete(path: string): Promise<void> {
        return fs.promises.unlink(this.resolve(path));
    }

    public createReadStream(path: string): NodeJS.ReadableStream {
        return fs.createReadStream(this.resolve(path));
    }

    private resolve(path: string): string {
        path = normalize(path);
        if (path.startsWith(sep)) {
            path = path.substring(1);
        }

        return resolve(this.root, path);
    }
}
