/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import { resolve } from 'path';
import { FileStorage } from './file-storage.js';

export class LocalFileStorage extends FileStorage {
    public constructor(root: string) {
        super();

        this.root = resolve(root);
    }

    public readonly root: string;

    public async mtime(path: string): Promise<Date> {
        return (await fs.promises.stat(resolve(this.root, path))).mtime;
    }

    public exists(path: string): Promise<boolean> {
        return Promise.resolve(fs.existsSync(resolve(this.root, path)));
    }

    public async isDirectory(path: string): Promise<boolean> {
        return (await fs.promises.stat(resolve(this.root, path))).isDirectory();
    }

    public mkdir(path: string, recursive = false): Promise<string | undefined> {
        return fs.promises.mkdir(resolve(this.root, path), { recursive: recursive });
    }

    public writeFile(path: string, data: string | Buffer): Promise<void> {
        return fs.promises.writeFile(resolve(this.root, path), data);
    }

    public readDir(path: string): Promise<string[]> {
        return fs.promises.readdir(resolve(this.root, path));
    }

    public readFile(path: string): Promise<Buffer> {
        return fs.promises.readFile(resolve(this.root, path));
    }

    public unlink(path: string): Promise<void> {
        return fs.promises.unlink(resolve(this.root, path));
    }

    public rename(oldPath: string, newPath: string): Promise<void> {
        return fs.promises.rename(resolve(this.root, oldPath), resolve(this.root, newPath));
    }

    public createReadStream(path: string): NodeJS.ReadableStream {
        return fs.createReadStream(resolve(this.root, path));
    }
}
