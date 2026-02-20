/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import fs, { Dirent } from 'fs';
import { describe, beforeEach, it, expect, afterEach, vitest, Mocked } from 'vitest';
import { LocalFileStorage } from '../../app/file-storage/local-file-storage.js';
import { resolve, sep } from 'path/posix';
import { createSpyObj } from '../mocks.js';

describe('LocalFileStorage', () => {
    let storage: LocalFileStorage;

    beforeEach(() => {
        storage = new LocalFileStorage('file:///endpoints/samples', sep);
    });

    afterEach(() => {
        vitest.restoreAllMocks();
    });

    it('should create', () => {
        expect(storage).toBeTruthy();
    });

    describe('exists', () => {
        it('returns true if file exists', async () => {
            vitest.spyOn(fs, 'existsSync').mockReturnValue(true);
            await expect(storage.exists('file.txt')).resolves.toBeTruthy();
            expect(fs.existsSync).toHaveBeenCalledWith(resolve('/file.txt'));
        });

        it('returns false if file does not exist', async () => {
            vitest.spyOn(fs, 'existsSync').mockReturnValue(false);
            await expect(storage.exists('unknown.txt')).resolves.toBeFalsy();
            expect(fs.existsSync).toHaveBeenCalledWith(resolve('/unknown.txt'));
        });
    });

    describe('readDir', () => {
        let files: Mocked<Dirent>[];

        beforeEach(() => {
            files = [
                createSpyObj<Dirent>(['isDirectory'], { name: 'A', parentPath: '/A' }),
                createSpyObj<Dirent>(['isDirectory'], { name: 'B', parentPath: '/B' }),
            ];

            files[0].isDirectory.mockReturnValue(false);
            files[1].isDirectory.mockReturnValue(true);
        });

        it('returns the directory contents', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vitest.spyOn(fs.promises, 'readdir').mockResolvedValue(files as any);
            await expect(storage.readDir('./')).resolves.toEqual([
                { name: 'A', path: '/A', type: 'file' },
                { name: 'B', path: '/B', type: 'directory' },
            ]);

            expect(fs.promises.readdir).toHaveBeenCalledWith(resolve('/'), { withFileTypes: true });
        });
    });

    describe('readFile', () => {
        it('reads the file content', async () => {
            vitest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('Hello world!'));
            const buffer = await storage.readFile('./a/file.txt');
            expect(buffer.toString()).toEqual('Hello world!');
            expect(fs.promises.readFile).toHaveBeenCalledWith(resolve('/a/file.txt'));
        });
    });
});
