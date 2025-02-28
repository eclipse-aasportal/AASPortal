/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, afterEach, beforeEach, it, expect, jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path/posix';
import { Cookie } from 'aas-core';
import { UserStorage } from '../../app/auth/user-storage.js';
import { LocalUserStorage } from '../../app/auth/local-user-storage.js';
import { UserData } from '../../app/auth/user-data.js';
import { createSpyObj } from 'fhg-jest';
import { Logger } from '../../app/logging/logger.js';
import { slash } from '../../app/convert.js';

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
            jest.restoreAllMocks();
        });

        describe('existsSync', function () {
            it('indicates that john.doe@email.com exists', async () => {
                jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
                await expect(userStorage.existAsync('john.doe@email.com')).resolves.toBe(true);
            });

            it('indicates that unknown@email.com does not exist', async () => {
                jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
                await expect(userStorage.existAsync('unknown@email.com')).resolves.toBe(false);
            });
        });

        describe('writeAsync', function () {
            it('writes a new user', async () => {
                jest.spyOn(fs, 'existsSync').mockReturnValue(false);
                jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
                jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
                await userStorage.writeAsync('jane.doe@email.com', {
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
                jest.spyOn(fs, 'existsSync').mockReturnValue(true);
                jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(JSON.stringify(johnDoe)));
                await expect(userStorage.readAsync('john.doe@email.com')).resolves.toEqual(johnDoe);
            });

            it('reads "undefined" for an unknown user', async () => {
                jest.spyOn(fs, 'existsSync').mockReturnValue(false);
                await expect(userStorage.readAsync('unknown@email.com')).resolves.toBeUndefined();
            });
        });

        describe('deleteAsync', function () {
            it('john.doe@email.com', async () => {
                jest.spyOn(fs, 'existsSync').mockReturnValue(true);
                jest.spyOn(fs.promises, 'rm').mockImplementation(() => new Promise<void>(resolve => resolve()));
                await expect(userStorage.deleteAsync('john.doe@email.com')).resolves.toBe(true);
                expect(fs.promises.rm).toHaveBeenCalled();
            });

            it('indicates that an unknown user was not deleted', async () => {
                jest.spyOn(fs, 'existsSync').mockReturnValue(false);
                await expect(userStorage.deleteAsync('unknown@email.com')).resolves.toBe(false);
            });
        });
    });

    describe('Cookies', () => {
        let cookies: Buffer;
        let usersDir: string;

        afterEach(() => {
            jest.restoreAllMocks();
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
                jest.spyOn(fs, 'existsSync').mockReturnValue(true);
                jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
                await expect(userStorage.checkCookieAsync('john.doe@email.com', 'Cookie1')).resolves.toBe(true);
            });

            it('indicates that "unknown" for john.doe@email.com not exist', async () => {
                jest.spyOn(fs, 'existsSync').mockReturnValue(true);
                jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
                await expect(userStorage.checkCookieAsync('john.doe@email.com', 'unknown')).resolves.toBe(false);
            });

            it('indicates that "Cookie1" for jane.doe@email.com not exist', async () => {
                jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
                await expect(userStorage.checkCookieAsync('jane.doe@email.com', 'Cookie1')).resolves.toBe(false);
            });
        });

        describe('getCookieAsync', () => {
            beforeEach(() => {
                jest.spyOn(fs, 'existsSync').mockReturnValue(true);
                jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
            });

            it('returns the value of "Cookie1" for john.doe@email.com', async () => {
                await expect(userStorage.getCookieAsync('john.doe@email.com', 'Cookie1')).resolves.toEqual({
                    name: 'Cookie1',
                    data: 'The quick brown fox jumps over the lazy dog.',
                });
            });

            it('returns "undefined" for "unknown" for john.doe@email.com', async () => {
                await expect(userStorage.getCookieAsync('john.doe@email.com', 'unknown')).resolves.toBeUndefined();
            });

            it('returns "undefined" for "Cookie1" for jane.doe@email.com', async () => {
                await expect(userStorage.getCookieAsync('jane.doe@email.com', 'unknown')).resolves.toBeUndefined();
            });
        });

        describe('getCookiesAsync', () => {
            beforeEach(() => {
                jest.spyOn(fs, 'existsSync').mockReturnValue(true);
                jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
            });

            it('returns all cookies for john.doe@email.com', async () => {
                await expect(userStorage.getCookiesAsync('john.doe@email.com')).resolves.toEqual([
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
                jest.spyOn(fs, 'existsSync').mockReturnValue(true);
                jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(cookies));
            });

            it('can set a new Cookie3 for john.doe@email.com', async () => {
                jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
                await userStorage.setCookieAsync('john.doe@email.com', 'Cookie3', 'Hello World!');
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
                await userStorage.setCookieAsync('john.doe@email.com', 'Cookie2', 'Hello World!');
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
                await userStorage.deleteCookieAsync('john.doe@email.com', 'Cookie1');
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
                await userStorage.deleteCookieAsync('john.doe@email.com', 'Cookie2');
                expect(fs.promises.unlink).toHaveBeenCalled();
            });
        });
    });
});