/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export interface FileStorageEntry {
    name: string;
    path: string;
    type: 'file' | 'directory';
}

/** Defines a file based AASX package source. */
export abstract class FileStorage {
    protected constructor(public readonly root: string) {}
    public abstract get url(): string;
    public abstract mtime(path: string): Promise<Date>;
    public abstract exists(path: string): Promise<boolean>;
    public abstract createDir(path: string, recursive?: boolean): Promise<void>;
    public abstract writeFile(path: string, data: string | Buffer): Promise<void>;
    public abstract readDir(path: string): Promise<FileStorageEntry[]>;
    public abstract readFile(path: string): Promise<Buffer>;
    public abstract delete(path: string): Promise<void>;
    public abstract createReadStream(path: string): NodeJS.ReadableStream;
}
