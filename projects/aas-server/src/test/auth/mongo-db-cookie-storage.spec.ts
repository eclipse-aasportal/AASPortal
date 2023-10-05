/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { MongoDBCookieStorage, UserCookies } from '../../app/auth/mongo-db-cookie-storage.js';
import { describe, beforeAll, beforeEach, it, expect, jest } from '@jest/globals';

interface UserCookiesInstance extends UserCookies {
    save(): Promise<void>;
    deleteOne: () => void;
}

interface Promisify {
    exec(): Promise<UserCookiesInstance | undefined>;
}

describe('MongoDBCookieStorage', function () {
    let cookieStorage: MongoDBCookieStorage;
    let userCookies: UserCookies;

    beforeAll(function () {
        cookieStorage = new MongoDBCookieStorage();
    });

    beforeEach(function () {
        userCookies = {
            id: 'john.doe@email.com',
            cookies: [
                {
                    name: 'Cookie1',
                    data: 'The quick brown fox jumps over the lazy dog.'
                },
                {
                    name: 'Cookie2',
                    data: '42'
                }
            ]
        };
    });

    describe('checkAsync', function () {
        it('indicates that "Cookie1" for john.doe@email.com exist', async function () {
            jest.spyOn(cookieStorage.UserCookiesModel, 'findOne').mockReturnValue(getInstance(userCookies));
            await expect(cookieStorage.checkAsync('john.doe@email.com', 'Cookie1')).resolves.toBe(true);
        });

        it('indicates that "unknown" for john.doe@email.com not exist', async function () {
            jest.spyOn(cookieStorage.UserCookiesModel, 'findOne').mockReturnValue(getInstance(userCookies));
            await expect(cookieStorage.checkAsync('john.doe@email.com', 'unknown')).resolves.toBe(false);
        });

        it('indicates that "Cookie1" for jane.doe@email.com not exist', async function () {
            jest.spyOn(cookieStorage.UserCookiesModel, 'findOne').mockReturnValue(getInstance());
            await expect(cookieStorage.checkAsync('jane.doe@email.com', 'Cookie1')).resolves.toBe(false);
        });
    });

    describe('getAsync', function () {
        it('returns the value of "Cookie1" for john.doe@email.com', async function () {
            jest.spyOn(cookieStorage.UserCookiesModel, 'findOne').mockReturnValue(getInstance(userCookies));

            await expect(cookieStorage.getAsync('john.doe@email.com', 'Cookie1'))
                .resolves.toEqual({ name: 'Cookie1', data: 'The quick brown fox jumps over the lazy dog.' });
        });

        it('returns "undefined" for "unknown" for john.doe@email.com', async function () {
            jest.spyOn(cookieStorage.UserCookiesModel, 'findOne').mockReturnValue(getInstance(userCookies));

            await expect(cookieStorage.getAsync('john.doe@email.com', 'unknown'))
                .resolves.toBeUndefined();
        });

        it('returns "undefined" for "Cookie1" for jane.doe@email.com', async function () {
            jest.spyOn(cookieStorage.UserCookiesModel, 'findOne').mockReturnValue(getInstance());

            await expect(cookieStorage.getAsync('jane.doe@email.com', 'unknown'))
                .resolves.toBeUndefined();
        });
    });

    describe('getAllAsync', function () {
        it('returns all cookies for john.doe@email.com', async function () {
            jest.spyOn(cookieStorage.UserCookiesModel, 'findOne').mockReturnValue(getInstance(userCookies));

            await expect(cookieStorage.getAllAsync('john.doe@email.com'))
                .resolves.toEqual([
                    {
                        name: 'Cookie1',
                        data: 'The quick brown fox jumps over the lazy dog.'
                    },
                    {
                        name: 'Cookie2',
                        data: '42'
                    }
                ]);
        });
    });

    describe('setAsync', function () {
        it('can set a new Cookie3 for john.doe@email.com', async function () {
            let save = jest.fn<() => Promise<void>>();
            jest.spyOn(cookieStorage.UserCookiesModel, 'findOne').mockReturnValue(getInstance(userCookies, save));

            await cookieStorage.setAsync('john.doe@email.com', 'Cookie3', 'Hello World!');
            expect(save).toHaveBeenCalled();
        });

        it('can update the existing Cookie2 for john.doe@email.com', async function () {
            let save = jest.fn<() => Promise<void>>();
            jest.spyOn(cookieStorage.UserCookiesModel, 'findOne').mockReturnValue(getInstance(userCookies, save));

            await cookieStorage.setAsync('john.doe@email.com', 'Cookie2', 'Hello World!');
            expect(save).toHaveBeenCalled();
        });
    });

    describe('deleteAsync', function () {
        it('can delete a cookie', async function () {
            let save = jest.fn<() => Promise<void>>();
            let deleteOne = jest.fn<() => Promise<void>>();
            jest.spyOn(cookieStorage.UserCookiesModel, 'findOne').mockReturnValue(getInstance(userCookies, save, deleteOne));

            await cookieStorage.deleteAsync('john.doe@email.com', 'Cookie1');
            expect(save).toHaveBeenCalled();

            await cookieStorage.deleteAsync('john.doe@email.com', 'Cookie2');
            expect(deleteOne).toHaveBeenCalled();
        });
    });

    function getInstance(user?: UserCookies, save?: () => Promise<void>, deleteOne?: () => Promise<void>): any {
        if (user) {
            return {
                exec: () => new Promise<UserCookiesInstance | undefined>((resolve, _) => resolve(
                    {
                        ...user,
                        save: save ?? (() => new Promise<void>((result, _) => result())),
                        deleteOne: deleteOne ?? (() => new Promise<void>((result, _) => result()))
                    }))
            } as Promisify;
        }

        return {
            exec: () => new Promise<UserCookiesInstance | undefined>((resolve, _) => resolve(undefined))
        } as Promisify;
    }
});