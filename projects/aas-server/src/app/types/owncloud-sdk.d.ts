/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

declare module 'owncloud-sdk' {
    export interface OwnCloudAuthentication {
        basic?: { username: string; password: string };
        bearer?: string;
    }

    export interface OwnCloudOptions {
        baseUrl: string;
        auth?: OwnCloudAuthentication;
    }

    export class FileInfo {
        public name: string;
        public type: string;
        public processing: boolean;
        public fileInfo: { [key: string]: string };

        public getName(): string;
        public getPath(): string;
        public getSize(): number;
        public getFileId(): number;
        public getContentType(): string;
        public getLastModified(): string;
        public getProperty(property: string): string;
        public isDir(): boolean;
    }

    export class Files {
        public list(path: string, depth = '1', properties: unknown[] = []): Promise<FileInfo[]>;
        public getFileContents(path: string, options?: { [key: string]: string }): Promise<string>;
        public getFileUrl(path: string): string;
        public getPathForFileId(fileId: number): Promise<string>;
        public putFileContents(
            path: string,
            content: string,
            options: { [key: string]: string } = {},
        ): Promise<boolean>;
        public createFolder(path: string): Promise<boolean>;
        public delete(path: string): Promise<boolean>;
        public fileInfo(path: string, properties: unknown[]): Promise<FileInfo>;
        public move(source: string, target: string, overwrite = false): Promise<boolean>;
        public copy(source: string, target: string, overwrite = false): Promise<boolean>;
    }

    export type UserInfo = { [key: string]: unknown };

    export default class ownCloud {
        public constructor(options?: OwnCloudOptions);

        public files: Files;

        public login(): Promise<UserInfo>;
        public logout(): void;
    }
}
