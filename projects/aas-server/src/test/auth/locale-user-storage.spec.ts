/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, afterEach, beforeEach, it, expect, jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import { UserStorage } from '../../app/auth/user-storage.js';
import { LocaleUserStorage } from '../../app/auth/locale-user-storage.js';
import { UserData } from '../../app/auth/user-data.js';

describe('LocaleUserStorage', function () {
    let userStorage: UserStorage;
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

        userStorage = new LocaleUserStorage(os.tmpdir());
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('existsSync', function () {
        it('indicates that john.doe@email.com exists', async function () {
            jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
            await expect(userStorage.existAsync('john.doe@email.com')).resolves.toBe(true);
        });

        it('indicates that unknown@email.com does not exist', async function () {
            jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
            await expect(userStorage.existAsync('unknown@email.com')).resolves.toBe(false);
        });
    });

    describe('writeAsync', function () {
        it('writes a new user', async function () {
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
        it('reads the data of john.doe@email.com', async function () {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from(JSON.stringify(johnDoe)));
            await expect(userStorage.readAsync('john.doe@email.com')).resolves.toEqual(johnDoe);
        });

        it('reads "undefined" for an unknown user', async function () {
            jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            await expect(userStorage.readAsync('unknown@email.com')).resolves.toBeUndefined();
        });
    });

    describe('deleteAsync', function () {
        it('john.doe@email.com', async function () {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs.promises, 'rm').mockImplementation(() => new Promise<void>(resolve => resolve()));
            await expect(userStorage.deleteAsync('john.doe@email.com')).resolves.toBe(true);
            expect(fs.promises.rm).toHaveBeenCalled();
        });

        it('indicates that an unknown user was not deleted', async function () {
            jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            await expect(userStorage.deleteAsync('unknown@email.com')).resolves.toBe(false);
        });
    });
});
