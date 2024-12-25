/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import fs, { Dirent } from 'fs';
import { describe, beforeEach, it, expect, jest, afterEach } from '@jest/globals';
import { LocalFileStorage } from '../../app/file-storage/local-file-storage.js';
import { resolve, sep } from 'path/posix';
import { createSpyObj } from 'fhg-jest';

describe('LocalFileStorage', () => {
    let storage: LocalFileStorage;

    beforeEach(() => {
        storage = new LocalFileStorage('file:///endpoints/samples', sep);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should create', () => {
        expect(storage).toBeTruthy();
    });

    describe('exists', () => {
        it('returns true if file exists', async () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            await expect(storage.exists('file.txt')).resolves.toBeTruthy();
            expect(fs.existsSync).toHaveBeenCalledWith(resolve('/file.txt'));
        });

        it('returns false if file does not exist', async () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            await expect(storage.exists('unknown.txt')).resolves.toBeFalsy();
            expect(fs.existsSync).toHaveBeenCalledWith(resolve('/unknown.txt'));
        });
    });

    describe('readDir', () => {
        let files: jest.Mocked<Dirent>[];

        beforeEach(() => {
            files = [
                createSpyObj<Dirent>(['isDirectory'], { name: 'A', path: '/A' }),
                createSpyObj<Dirent>(['isDirectory'], { name: 'B', path: '/B' }),
            ];

            files[0].isDirectory.mockReturnValue(false);
            files[1].isDirectory.mockReturnValue(true);
        });

        it('returns the directory contents', async () => {
            jest.spyOn(fs.promises, 'readdir').mockResolvedValue(files);
            await expect(storage.readDir('./')).resolves.toEqual([
                { name: 'A', path: '/A', type: 'file' },
                { name: 'B', path: '/B', type: 'directory' },
            ]);

            expect(fs.promises.readdir).toHaveBeenCalledWith(resolve('/'), { withFileTypes: true });
        });
    });

    describe('readFile', () => {
        it('reads the file content', async () => {
            jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('Hello world!'));
            const buffer = await storage.readFile('./a/file.txt');
            expect(buffer.toString()).toEqual('Hello world!');
            expect(fs.promises.readFile).toHaveBeenCalledWith(resolve('/a/file.txt'));
        });
    });
});
