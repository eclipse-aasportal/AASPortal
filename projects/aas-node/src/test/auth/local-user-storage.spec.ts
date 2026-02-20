/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, afterEach, beforeEach, it, expect, vitest } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path/posix';
import { Cookie } from 'aas-core';
import { UserStorage } from '../../app/auth/user-storage.js';
import { LocalUserStorage } from '../../app/auth/local-user-storage.js';
import { UserData } from '../../app/auth/user-data.js';
import { createSpyObj } from '../mocks.js';
import { Logger } from '../../app/logging/logger.js';
import { slash } from '../../app/utilities.js';

describe('LocaleUserStorage', function () {
    let userStorage: UserStorage;

    describe('User', () => {
        let johnDoe: UserData;

        beforeEach(function () {
            johnDoe = {
                id: 'john.doe@email.com',
                name: 'John Doe',
                role: 'editor',
                password: '$2a$10$6qZT2ZM5jUVU/pLLQUjCvuXplG.GwPnoz48C1Eg/dKqjIrGE8jm0a',
                created: new Date(),
                lastLoggedIn: new Date(0),
            };

            userStorage = new LocalUserStorage(createSpyObj<Logger>(['error']), os.tmpdir());
        });

        afterEach(() => {
            vitest.restoreAllMocks();
        });

        describe('existsSync', function () {
            it('indicates that john.doe@email.com exists', async () => {
                vitest.spyOn(fs, 'existsSync').mockImplementation(() => true);
                await expect(userStorage.exist('john.doe@email.com')).resolves.toBe(true);
            });

            it('indicates that unknown@email.com does not exist', async () => {
                vitest.spyOn(fs, 'existsSync').mockImplementation(() => false);
                await expect(userStorage.exist('unknown@email.com')).resolves.toBe(false);
            });
        });

        describe('writeAsync', function () {
            it('writes a new user', async () => {
                vitest.spyOn(fs, 'existsSync').mockReturnValue(false);
                vitest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
                vitest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
                await userStorage.write('jane.doe@email.com', {
                    id: 'jane.doe@email.com',
                    name: 'Jane Doe',
                    password: '12345678',
                    role: 'editor',
                    created: new Date(),
                    lastLoggedIn: new Date(),
                });

                expect(fs.promises.mkdir).toHaveBeenCalled();
                expect(fs.promises.writeFile).toHaveBeenCalled();
            });
        });

        describe('readAsync', function () {
            it('reads the data of john.doe@email.com', async () => {
                vitest.spyOn(fs, 'existsSync').mockReturnValue(true);
                vitest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(JSON.stringify(johnDoe)));
                await expect(userStorage.read('john.doe@email.com')).resolves.toEqual(johnDoe);
            });

            it('reads "undefined" for an unknown user', async () => {
                vitest.spyOn(fs, 'existsSync').mockReturnValue(false);
                await expect(userStorage.read('unknown@email.com')).resolves.toBeUndefined();
            });
        });

        describe('deleteAsync', function () {
            it('john.doe@email.com', async () => {
                vitest.spyOn(fs, 'existsSync').mockReturnValue(true);
                vitest.spyOn(fs.promises, 'rm').mockImplementation(() => new Promise<void>(resolve => resolve()));
                await expect(userStorage.delete('john.doe@email.com')).resolves.toBe(true);
                expect(fs.promises.rm).toHaveBeenCalled();
            });

            it('indicates that an unknown user was not deleted', async () => {
                vitest.spyOn(fs, 'existsSync').mockReturnValue(false);
                await expect(userStorage.delete('unknown@email.com')).resolves.toBe(false);
            });
        });
    });

    describe('Cookies', () => {
        let cookies: Buffer;
        let usersDir: string;

        afterEach(() => {
            vitest.restoreAllMocks();
        });

        beforeEach(async () => {
            usersDir = slash(os.tmpdir());
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

            userStorage = new LocalUserStorage(createSpyObj<Logger>(['error']), usersDir);
        });

        describe('checkCookieAsync', () => {
            it('indicates that "Cookie1" for john.doe@email.com exist', async () => {
                vitest.spyOn(fs, 'existsSync').mockReturnValue(true);
                vitest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
                await expect(userStorage.checkCookie('john.doe@email.com', 'Cookie1')).resolves.toBe(true);
            });

            it('indicates that "unknown" for john.doe@email.com not exist', async () => {
                vitest.spyOn(fs, 'existsSync').mockReturnValue(true);
                vitest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
                await expect(userStorage.checkCookie('john.doe@email.com', 'unknown')).resolves.toBe(false);
            });

            it('indicates that "Cookie1" for jane.doe@email.com not exist', async () => {
                vitest.spyOn(fs, 'existsSync').mockImplementation(() => false);
                await expect(userStorage.checkCookie('jane.doe@email.com', 'Cookie1')).resolves.toBe(false);
            });
        });

        describe('getCookieAsync', () => {
            beforeEach(() => {
                vitest.spyOn(fs, 'existsSync').mockReturnValue(true);
                vitest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
            });

            it('returns the value of "Cookie1" for john.doe@email.com', async () => {
                await expect(userStorage.getCookie('john.doe@email.com', 'Cookie1')).resolves.toEqual({
                    name: 'Cookie1',
                    data: 'The quick brown fox jumps over the lazy dog.',
                });
            });

            it('returns "undefined" for "unknown" for john.doe@email.com', async () => {
                await expect(userStorage.getCookie('john.doe@email.com', 'unknown')).resolves.toBeUndefined();
            });

            it('returns "undefined" for "Cookie1" for jane.doe@email.com', async () => {
                await expect(userStorage.getCookie('jane.doe@email.com', 'unknown')).resolves.toBeUndefined();
            });
        });

        describe('getCookiesAsync', () => {
            beforeEach(() => {
                vitest.spyOn(fs, 'existsSync').mockReturnValue(true);
                vitest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
            });

            it('returns all cookies for john.doe@email.com', async () => {
                await expect(userStorage.getCookies('john.doe@email.com')).resolves.toEqual([
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

        describe('setCookieAsync', () => {
            beforeEach(() => {
                vitest.spyOn(fs, 'existsSync').mockReturnValue(true);
                vitest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
            });

            it('can set a new Cookie3 for john.doe@email.com', async () => {
                vitest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
                await userStorage.setCookie('john.doe@email.com', 'Cookie3', 'Hello World!');
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
                vitest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
                await userStorage.setCookie('john.doe@email.com', 'Cookie2', 'Hello World!');
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
                vitest.spyOn(fs, 'existsSync').mockReturnValue(true);
                vitest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
                vitest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
                await userStorage.deleteCookie('john.doe@email.com', 'Cookie1');
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
                vitest.spyOn(fs, 'existsSync').mockReturnValue(true);
                vitest.spyOn(fs.promises, 'readFile').mockResolvedValue(
                    Buffer.from(
                        JSON.stringify([
                            {
                                name: 'Cookie2',
                                data: 42,
                            },
                        ]),
                    ),
                );

                vitest.spyOn(fs.promises, 'unlink').mockResolvedValue();
                await userStorage.deleteCookie('john.doe@email.com', 'Cookie2');
                expect(fs.promises.unlink).toHaveBeenCalled();
            });
        });
    });
});
