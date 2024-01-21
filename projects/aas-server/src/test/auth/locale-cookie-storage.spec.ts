/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Cookie } from 'common';
import { CookieStorage } from '../../app/auth/cookie-storage.js';
import { LocaleCookieStorage } from '../../app/auth/locale-cookie-storage.js';
import { describe, beforeEach, it, expect, jest, afterEach } from '@jest/globals';
import { createSpyObj } from '../utils.js';
import { Logger } from '../../app/logging/logger.js';

describe('LocaleCookieStorage', () => {
    let cookieStorage: CookieStorage;
    let cookies: Buffer;
    let usersDir: string;

    afterEach(() => {
        jest.restoreAllMocks();
    });

    beforeEach(async () => {
        usersDir = os.tmpdir();
        cookies = Buffer.from(
            JSON.stringify([
                {
                    name: 'Cookie1',
                    data: 'The quick brown fox jumps over the lazy dog.',
                },
                {
                    name: 'Cookie2',
                    data: 42,
                },
            ]),
        );

        cookieStorage = new LocaleCookieStorage(createSpyObj<Logger>(['error']), usersDir);
    });

    describe('checkAsync', () => {
        it('indicates that "Cookie1" for john.doe@email.com exist', async () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
            await expect(cookieStorage.checkAsync('john.doe@email.com', 'Cookie1')).resolves.toBe(true);
        });

        it('indicates that "unknown" for john.doe@email.com not exist', async () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
            await expect(cookieStorage.checkAsync('john.doe@email.com', 'unknown')).resolves.toBe(false);
        });

        it('indicates that "Cookie1" for jane.doe@email.com not exist', async () => {
            jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
            await expect(cookieStorage.checkAsync('jane.doe@email.com', 'Cookie1')).resolves.toBe(false);
        });
    });

    describe('getAsync', () => {
        beforeEach(() => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
        });

        it('returns the value of "Cookie1" for john.doe@email.com', async () => {
            await expect(cookieStorage.getAsync('john.doe@email.com', 'Cookie1')).resolves.toEqual({
                name: 'Cookie1',
                data: 'The quick brown fox jumps over the lazy dog.',
            });
        });

        it('returns "undefined" for "unknown" for john.doe@email.com', async () => {
            await expect(cookieStorage.getAsync('john.doe@email.com', 'unknown')).resolves.toBeUndefined();
        });

        it('returns "undefined" for "Cookie1" for jane.doe@email.com', async () => {
            await expect(cookieStorage.getAsync('jane.doe@email.com', 'unknown')).resolves.toBeUndefined();
        });
    });

    describe('getAllAsync', () => {
        beforeEach(() => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
        });

        it('returns all cookies for john.doe@email.com', async () => {
            await expect(cookieStorage.getAllAsync('john.doe@email.com')).resolves.toEqual([
                {
                    name: 'Cookie1',
                    data: 'The quick brown fox jumps over the lazy dog.',
                },
                {
                    name: 'Cookie2',
                    data: 42,
                },
            ] as Cookie[]);
        });
    });

    describe('setAsync', () => {
        beforeEach(() => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
        });

        it('can set a new Cookie3 for john.doe@email.com', async () => {
            jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
            await cookieStorage.setAsync('john.doe@email.com', 'Cookie3', 'Hello World!');
            expect(fs.promises.writeFile).toHaveBeenCalledWith(
                path.join(usersDir, 'john.doe@email.com', 'cookies.json'),
                JSON.stringify([
                    {
                        name: 'Cookie1',
                        data: 'The quick brown fox jumps over the lazy dog.',
                    },
                    {
                        name: 'Cookie2',
                        data: 42,
                    },
                    {
                        name: 'Cookie3',
                        data: 'Hello World!',
                    },
                ] as Cookie[]),
            );
        });

        it('can update the existing Cookie2 for john.doe@email.com', async () => {
            jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
            await cookieStorage.setAsync('john.doe@email.com', 'Cookie2', 'Hello World!');
            expect(fs.promises.writeFile).toHaveBeenCalledWith(
                path.join(usersDir, 'john.doe@email.com', 'cookies.json'),
                JSON.stringify([
                    {
                        name: 'Cookie1',
                        data: 'The quick brown fox jumps over the lazy dog.',
                    },
                    {
                        name: 'Cookie2',
                        data: 'Hello World!',
                    },
                ] as Cookie[]),
            );
        });
    });

    describe('deleteAsync', () => {
        it('can delete a cookie', async () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
            jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
            await cookieStorage.deleteAsync('john.doe@email.com', 'Cookie1');
            expect(fs.promises.writeFile).toHaveBeenCalledWith(
                path.join(usersDir, 'john.doe@email.com', 'cookies.json'),
                JSON.stringify([
                    {
                        name: 'Cookie2',
                        data: 42,
                    },
                ]),
            );
        });

        it('removes the cookies file on empty cookies', async () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs.promises, 'readFile').mockResolvedValue(
                Buffer.from(
                    JSON.stringify([
                        {
                            name: 'Cookie2',
                            data: 42,
                        },
                    ]),
                ),
            );

            jest.spyOn(fs.promises, 'unlink').mockResolvedValue();
            await cookieStorage.deleteAsync('john.doe@email.com', 'Cookie2');
            expect(fs.promises.unlink).toHaveBeenCalled();
        });
    });
});
