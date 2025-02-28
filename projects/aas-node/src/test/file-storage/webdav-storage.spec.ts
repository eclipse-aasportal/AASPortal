/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, afterEach, jest } from '@jest/globals';
import { WebDAVStorage } from '../../app/file-storage/webdav-storage.js';
import { FileStat, WebDAVClient } from 'webdav';
import { createSpyObj } from 'fhg-jest';

describe('WebDAVStorage', () => {
    let storage: WebDAVStorage;
    let client: jest.Mocked<WebDAVClient>;

    beforeEach(() => {
        client = createSpyObj<WebDAVClient>(['exists', 'getDirectoryContents', 'getFileContents']);
        storage = new WebDAVStorage('webdav://localhost:1234/', client);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should create', () => {
        expect(storage).toBeTruthy();
    });

    describe('exists', () => {
        it('returns true if file exists', async () => {
            client.exists.mockResolvedValue(true);
            await expect(storage.exists('file.txt')).resolves.toBeTruthy();
            expect(client.exists).toHaveBeenCalledWith('/file.txt');
        });

        it('returns false if file does not exist', async () => {
            client.exists.mockResolvedValue(false);
            await expect(storage.exists('unknown.txt')).resolves.toBeFalsy();
            expect(client.exists).toHaveBeenCalledWith('/unknown.txt');
        });
    });

    describe('readDir', () => {
        let files: FileStat[];

        beforeEach(() => {
            files = [
                { filename: '/A', basename: 'A', lastmod: '', size: 42, type: 'file', etag: null },
                { filename: '/B', basename: 'B', lastmod: '', size: 0, type: 'directory', etag: null },
            ];
        });

        it('returns the directory contents', async () => {
            client.getDirectoryContents.mockResolvedValue(files);
            await expect(storage.readDir('./')).resolves.toEqual([
                { name: 'A', path: '/', type: 'file' },
                { name: 'B', path: '/', type: 'directory' },
            ]);

            expect(client.getDirectoryContents).toHaveBeenCalledWith('/');
        });
    });

    describe('readFile', () => {
        it('reads the file content', async () => {
            client.getFileContents.mockResolvedValue(Buffer.from('Hello world!'));
            const buffer = await storage.readFile('./a/file.txt');
            expect(buffer.toString()).toEqual('Hello world!');
            expect(client.getFileContents).toHaveBeenCalledWith('/a/file.txt');
        });
    });
});