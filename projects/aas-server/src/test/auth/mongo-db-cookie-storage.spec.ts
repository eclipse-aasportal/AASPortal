/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { MongoDBCookieStorage, UserCookies } from '../../app/auth/mongo-db-cookie-storage.js';
import { describe, beforeEach, it, expect, jest, afterEach, beforeAll } from '@jest/globals';
import { MongoDBConnection } from '../../app/auth/mongo-db-connection.js';
import { createSpyObj } from '../utils.js';

interface UserCookiesInstance extends UserCookies {
    save(): Promise<void>;
    deleteOne: () => void;
}

interface Promisify {
    exec(): Promise<UserCookiesInstance | undefined>;
}

describe('MongoDBCookieStorage', () => {
    let cookieStorage: MongoDBCookieStorage;
    let userCookies: UserCookies;
    let connection: jest.Mocked<MongoDBConnection>;

    beforeAll(() => {
        connection = createSpyObj<MongoDBConnection>(['ensureConnected']);
        connection.ensureConnected.mockResolvedValue();
        cookieStorage = new MongoDBCookieStorage(connection);
    });

    beforeEach(() => {
        userCookies = {
            id: 'john.doe@email.com',
            cookies: [
                {
                    name: 'Cookie1',
                    data: 'The quick brown fox jumps over the lazy dog.',
                },
                {
                    name: 'Cookie2',
                    data: '42',
                },
            ],
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('checkAsync', () => {
        it('indicates that "Cookie1" for john.doe@email.com exist', async () => {
            jest.spyOn(cookieStorage.model, 'findOne').mockReturnValue(getInstance(userCookies));
            await expect(cookieStorage.checkAsync('john.doe@email.com', 'Cookie1')).resolves.toBe(true);
        });

        it('indicates that "unknown" for john.doe@email.com not exist', async () => {
            jest.spyOn(cookieStorage.model, 'findOne').mockReturnValue(getInstance(userCookies));
            await expect(cookieStorage.checkAsync('john.doe@email.com', 'unknown')).resolves.toBe(false);
        });

        it('indicates that "Cookie1" for jane.doe@email.com not exist', async () => {
            jest.spyOn(cookieStorage.model, 'findOne').mockReturnValue(getInstance());
            await expect(cookieStorage.checkAsync('jane.doe@email.com', 'Cookie1')).resolves.toBe(false);
        });
    });

    describe('getAsync', () => {
        it('returns the value of "Cookie1" for john.doe@email.com', async () => {
            jest.spyOn(cookieStorage.model, 'findOne').mockReturnValue(getInstance(userCookies));

            await expect(cookieStorage.getAsync('john.doe@email.com', 'Cookie1')).resolves.toEqual({
                name: 'Cookie1',
                data: 'The quick brown fox jumps over the lazy dog.',
            });
        });

        it('returns "undefined" for "unknown" for john.doe@email.com', async () => {
            jest.spyOn(cookieStorage.model, 'findOne').mockReturnValue(getInstance(userCookies));

            await expect(cookieStorage.getAsync('john.doe@email.com', 'unknown')).resolves.toBeUndefined();
        });

        it('returns "undefined" for "Cookie1" for jane.doe@email.com', async () => {
            jest.spyOn(cookieStorage.model, 'findOne').mockReturnValue(getInstance());

            await expect(cookieStorage.getAsync('jane.doe@email.com', 'unknown')).resolves.toBeUndefined();
        });
    });

    describe('getAllAsync', () => {
        it('returns all cookies for john.doe@email.com', async () => {
            jest.spyOn(cookieStorage.model, 'findOne').mockReturnValue(getInstance(userCookies));

            await expect(cookieStorage.getAllAsync('john.doe@email.com')).resolves.toEqual([
                {
                    name: 'Cookie1',
                    data: 'The quick brown fox jumps over the lazy dog.',
                },
                {
                    name: 'Cookie2',
                    data: '42',
                },
            ]);
        });
    });

    describe('setAsync', () => {
        it('can set a new Cookie3 for john.doe@email.com', async () => {
            const save = jest.fn<() => Promise<void>>();
            jest.spyOn(cookieStorage.model, 'findOne').mockReturnValue(getInstance(userCookies, save));

            await cookieStorage.setAsync('john.doe@email.com', 'Cookie3', 'Hello World!');
            expect(save).toHaveBeenCalled();
        });

        it('can update the existing Cookie2 for john.doe@email.com', async () => {
            const save = jest.fn<() => Promise<void>>();
            jest.spyOn(cookieStorage.model, 'findOne').mockReturnValue(getInstance(userCookies, save));

            await cookieStorage.setAsync('john.doe@email.com', 'Cookie2', 'Hello World!');
            expect(save).toHaveBeenCalled();
        });
    });

    describe('deleteAsync', () => {
        it('can delete a cookie', async () => {
            const save = jest.fn<() => Promise<void>>();
            const deleteOne = jest.fn<() => Promise<void>>();
            jest.spyOn(cookieStorage.model, 'findOne').mockReturnValue(getInstance(userCookies, save, deleteOne));

            await cookieStorage.deleteAsync('john.doe@email.com', 'Cookie1');
            expect(save).toHaveBeenCalled();

            await cookieStorage.deleteAsync('john.doe@email.com', 'Cookie2');
            expect(deleteOne).toHaveBeenCalled();
        });
    });

    function getInstance(user?: UserCookies, save?: () => Promise<void>, deleteOne?: () => Promise<void>): any {
        if (user) {
            return {
                exec: () =>
                    new Promise<UserCookiesInstance | undefined>(resolve =>
                        resolve({
                            ...user,
                            save: save ?? (() => new Promise<void>(result => result())),
                            deleteOne: deleteOne ?? (() => new Promise<void>(result => result())),
                        }),
                    ),
            } as Promisify;
        }

        return {
            exec: () => new Promise<UserCookiesInstance | undefined>(resolve => resolve(undefined)),
        } as Promisify;
    }
});
