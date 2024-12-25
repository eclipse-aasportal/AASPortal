/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { MongoDBUserStorage, UserCookies } from '../../app/auth/mongo-db-user-storage.js';
import { UserData } from '../../app/auth/user-data.js';
import { describe, beforeAll, beforeEach, it, expect, jest, afterEach } from '@jest/globals';
import { createSpyObj } from 'fhg-jest';
import { Variable } from '../../app/variable.js';
import mongoose from 'mongoose';

interface UserDataInstance extends UserData {
    save(): Promise<void>;
}

interface Promisify {
    exec(): Promise<UserDataInstance | undefined>;
}

interface UserCookiesInstance extends UserCookies {
    save(): Promise<void>;
    deleteOne: () => void;
}

describe('MongoDBUserStorage', () => {
    let userStorage: MongoDBUserStorage;

    beforeAll(() => {
        const variable = createSpyObj<Variable>([], {
            USER_STORAGE: 'mongodb://localhost:27017/aasportal-users',
            AAS_NODE_USERNAME: 'username',
            AAS_NODE_PASSWORD: 'password',
        });

        jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
        userStorage = new MongoDBUserStorage(variable);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Users', () => {
        let johnDoe: UserData;

        beforeEach(() => {
            johnDoe = {
                id: 'john.doe@email.com',
                name: 'John Doe',
                role: 'editor',
                password: '$2a$10$6qZT2ZM5jUVU/pLLQUjCvuXplG.GwPnoz48C1Eg/dKqjIrGE8jm0a',
                created: new Date(),
                lastLoggedIn: new Date(0),
            };
        });

        it('indicates that john.doe@email.com exists', async () => {
            jest.spyOn(userStorage.userModel, 'findOne').mockReturnValue(getPromisify(johnDoe));
            await expect(userStorage.existAsync('john.doe@email.com')).resolves.toBe(true);
        });

        it('indicates that unknown@email.com does not exist', async () => {
            jest.spyOn(userStorage.userModel, 'findOne').mockReturnValue(getPromisify());
            await expect(userStorage.existAsync('unknown@email.com')).resolves.toBe(false);
        });

        it('reads the data of john.doe@email.com', async () => {
            jest.spyOn(userStorage.userModel, 'findOne').mockReturnValue(getPromisify(johnDoe));
            const user = (await userStorage.readAsync('john.doe@email.com'))!;
            expect(user).toBeDefined();
            expect(user.id).toEqual(johnDoe.id);
            expect(user.name).toEqual(johnDoe.name);
            expect(user.role).toEqual(johnDoe.role);
            expect(user.password).toEqual(johnDoe.password);
        });

        it('reads "undefined" for an unknown user', async () => {
            jest.spyOn(userStorage.userModel, 'findOne').mockReturnValue(getPromisify());
            await expect(userStorage.readAsync('unknown@email.com')).resolves.toBe(undefined);
        });

        it('updates the data of john.doe@email.com', async () => {
            const save = jest.fn<() => Promise<void>>();
            jest.spyOn(userStorage.userModel, 'findOne').mockReturnValue(getPromisify(johnDoe, save));
            await userStorage.writeAsync('john.doe@email.com', { ...johnDoe });
            expect(save).toHaveBeenCalled;
        });

        it('deletes john.doe@email.com', async () => {
            jest.spyOn(userStorage.userModel, 'findOneAndDelete').mockReturnValue(getPromisify(johnDoe));
            await expect(userStorage.deleteAsync('john.doe@email.com')).resolves.toBe(true);
        });

        function getInstance(user: UserData, save?: () => Promise<void>): UserDataInstance {
            return {
                ...user,
                save: save ?? (() => new Promise<void>(resolve => resolve())),
            };
        }

        function getPromisify(user?: UserData, save?: () => Promise<void>): any {
            if (user) {
                return {
                    exec: () => new Promise<UserDataInstance | undefined>(resolve => resolve(getInstance(user, save))),
                } as Promisify;
            }

            return {
                exec: () => new Promise<UserDataInstance | undefined>(resolve => resolve(undefined)),
            } as Promisify;
        }
    });

    describe('Cookies', () => {
        let userCookies: UserCookies;

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

        describe('checkCookieAsync', () => {
            it('indicates that "Cookie1" for john.doe@email.com exist', async () => {
                jest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies));
                await expect(userStorage.checkCookieAsync('john.doe@email.com', 'Cookie1')).resolves.toBe(true);
            });

            it('indicates that "unknown" for john.doe@email.com not exist', async () => {
                jest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies));
                await expect(userStorage.checkCookieAsync('john.doe@email.com', 'unknown')).resolves.toBe(false);
            });

            it('indicates that "Cookie1" for jane.doe@email.com not exist', async () => {
                jest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance());
                await expect(userStorage.checkCookieAsync('jane.doe@email.com', 'Cookie1')).resolves.toBe(false);
            });
        });

        describe('getCookieAsync', () => {
            it('returns the value of "Cookie1" for john.doe@email.com', async () => {
                jest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies));

                await expect(userStorage.getCookieAsync('john.doe@email.com', 'Cookie1')).resolves.toEqual({
                    name: 'Cookie1',
                    data: 'The quick brown fox jumps over the lazy dog.',
                });
            });

            it('returns "undefined" for "unknown" for john.doe@email.com', async () => {
                jest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies));

                await expect(userStorage.getCookieAsync('john.doe@email.com', 'unknown')).resolves.toBeUndefined();
            });

            it('returns "undefined" for "Cookie1" for jane.doe@email.com', async () => {
                jest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance());

                await expect(userStorage.getCookieAsync('jane.doe@email.com', 'unknown')).resolves.toBeUndefined();
            });
        });

        describe('getCookiesAsync', () => {
            it('returns all cookies for john.doe@email.com', async () => {
                jest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies));

                await expect(userStorage.getCookiesAsync('john.doe@email.com')).resolves.toEqual([
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

        describe('setCookieAsync', () => {
            it('can set a new Cookie3 for john.doe@email.com', async () => {
                const save = jest.fn<() => Promise<void>>();
                jest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies, save));

                await userStorage.setCookieAsync('john.doe@email.com', 'Cookie3', 'Hello World!');
                expect(save).toHaveBeenCalled();
            });

            it('can update the existing Cookie2 for john.doe@email.com', async () => {
                const save = jest.fn<() => Promise<void>>();
                jest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies, save));

                await userStorage.setCookieAsync('john.doe@email.com', 'Cookie2', 'Hello World!');
                expect(save).toHaveBeenCalled();
            });
        });

        describe('deleteCookieAsync', () => {
            it('can delete a cookie', async () => {
                const save = jest.fn<() => Promise<void>>();
                const deleteOne = jest.fn<() => Promise<void>>();
                jest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(
                    getInstance(userCookies, save, deleteOne),
                );

                await userStorage.deleteCookieAsync('john.doe@email.com', 'Cookie1');
                expect(save).toHaveBeenCalled();

                await userStorage.deleteCookieAsync('john.doe@email.com', 'Cookie2');
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
});
