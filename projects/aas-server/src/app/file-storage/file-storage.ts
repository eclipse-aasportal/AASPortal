/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

/** Defines a file based AASX package source. */
export abstract class FileStorage {
    public abstract readonly root: string;
    public abstract mtime(path: string): Promise<Date>;
    public abstract exists(path: string): Promise<boolean>;
    public abstract isDirectory(path: string): Promise<boolean>;
    public abstract mkdir(path: string, recursive?: boolean): Promise<string | undefined>;
    public abstract writeFile(path: string, data: string | Buffer): Promise<void>;
    public abstract readDir(path: string): Promise<string[]>;
    public abstract readFile(path: string): Promise<Buffer>;
    public abstract unlink(path: string): Promise<void>;
    public abstract rename(oldPath: string, newPath: string): Promise<void>;
    public abstract createReadStream(path: string): NodeJS.ReadableStream;
}
