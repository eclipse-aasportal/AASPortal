/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import fs from 'fs';
import { Cookie } from 'common';
import { CookieStorage } from '../../app/auth/cookie-storage.js';
import { LocaleCookieStorage } from '../../app/auth/locale-cookie-storage.js';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { createSpyObj } from '../utils.js';
import { Logger } from '../../app/logging/logger.js';

describe('LocaleCookieStorage', function () {
    let usersDir: string;
    let cookieStorage: CookieStorage;
    let cookies: Cookie[];

    beforeEach(async function () {
        usersDir = '/users';
        cookies = [
            {
                name: 'Cookie1',
                data: 'The quick brown fox jumps over the lazy dog.'
            },
            {
                name: 'Cookie2',
                data: '42'
            }
        ];

        jest.spyOn(fs.promises, 'readFile').mockImplementation(() => {
            return new Promise<Buffer>(resolve => resolve(Buffer.from(JSON.stringify(cookies))));
        });

        cookieStorage = new LocaleCookieStorage(createSpyObj<Logger>(['error']), usersDir);
    });

    describe('checkAsync', function () {
        it('indicates that "Cookie1" for john.doe@email.com exist', async function () {
            jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
            await expect(cookieStorage.checkAsync('john.doe@email.com', 'Cookie1')).resolves.toBe(true);
        });

        it('indicates that "unknown" for john.doe@email.com not exist', async function () {
            jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
            await expect(cookieStorage.checkAsync('john.doe@email.com', 'unknown')).resolves.toBe(false);
        });

        it('indicates that "Cookie1" for jane.doe@email.com not exist', async function () {
            jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
            await expect(cookieStorage.checkAsync('jane.doe@email.com', 'Cookie1')).resolves.toBe(false);
        });
    });

    // describe('getAsync', function () {
    //     it('returns the value of "Cookie1" for john.doe@email.com', async function () {
    //         await expect(cookieStorage.getAsync('john.doe@email.com', 'Cookie1'))
    //             .resolves.toEqual({ name: 'Cookie1', data: 'The quick brown fox jumps over the lazy dog.' });
    //     });

    //     it('returns "undefined" for "unknown" for john.doe@email.com', async function () {
    //         await expect(cookieStorage.getAsync('john.doe@email.com', 'unknown'))
    //             .resolves.toBeUndefined();
    //     });

    //     it('returns "undefined" for "Cookie1" for jane.doe@email.com', async function () {
    //         await expect(cookieStorage.getAsync('jane.doe@email.com', 'unknown'))
    //             .resolves.toBeUndefined();
    //     });
    // });

    // describe('getAllAsync', function () {
    //     it('returns all cookies for john.doe@email.com', async function () {
    //         await expect(cookieStorage.getAllAsync('john.doe@email.com'))
    //             .resolves.toEqual([
    //                 {
    //                     name: 'Cookie1',
    //                     data: 'The quick brown fox jumps over the lazy dog.'
    //                 },
    //                 {
    //                     name: 'Cookie2',
    //                     data: '42'
    //                 }
    //             ]);
    //     });
    // });

    // describe('setAsync', function () {
    //     it('can set a new Cookie3 for john.doe@email.com', async function () {
    //         await cookieStorage.setAsync('john.doe@email.com', 'Cookie3', 'Hello World!');
    //         let items = JSON.parse((await readFile(join(userDir, 'cookies.json'))).toString()) as Cookie[];
    //         expect(items.find(item => item.name === 'Cookie3')).toEqual({ name: 'Cookie3', data: 'Hello World!' } as Cookie);
    //     });

    //     it('can update the existing Cookie2 for john.doe@email.com', async function () {
    //         await cookieStorage.setAsync('john.doe@email.com', 'Cookie2', 'Hello World!');
    //         let items = JSON.parse((await readFile(join(userDir, 'cookies.json'))).toString()) as Cookie[];
    //         expect(items.find(item => item.name === 'Cookie2')).toEqual({ name: 'Cookie2', data: 'Hello World!' } as Cookie);
    //     });
    // });

    // describe('deleteAsync', function () {
    //     it('can delete a cookie', async function () {
    //         await cookieStorage.deleteAsync('john.doe@email.com', 'Cookie1');
    //         let items = JSON.parse((await readFile(join(userDir, 'cookies.json'))).toString()) as Cookie[];
    //         expect(items.find(item => item.name === 'Cookie1')).toBeUndefined();

    //         await cookieStorage.deleteAsync('john.doe@email.com', 'Cookie2');
    //         expect(existsSync(join(userDir, 'cookies.json'))).toBeFalsy();
    //     });
    // });
});