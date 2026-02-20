/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { MongoDBUserStorage, UserCookies } from '../../app/auth/mongo-db-user-storage.js';
import { UserData } from '../../app/auth/user-data.js';
import { describe, beforeAll, beforeEach, it, expect, afterEach, vitest } from 'vitest';
import { createSpyObj } from '../mocks.js';
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

        vitest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
        userStorage = new MongoDBUserStorage(variable);
    });

    afterEach(() => {
        vitest.restoreAllMocks();
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
            vitest.spyOn(userStorage.userModel, 'findOne').mockReturnValue(getPromisify(johnDoe));
            await expect(userStorage.exist('john.doe@email.com')).resolves.toBe(true);
        });

        it('indicates that unknown@email.com does not exist', async () => {
            vitest.spyOn(userStorage.userModel, 'findOne').mockReturnValue(getPromisify());
            await expect(userStorage.exist('unknown@email.com')).resolves.toBe(false);
        });

        it('reads the data of john.doe@email.com', async () => {
            vitest.spyOn(userStorage.userModel, 'findOne').mockReturnValue(getPromisify(johnDoe));
            const user = (await userStorage.read('john.doe@email.com'))!;
            expect(user).toBeDefined();
            expect(user.id).toEqual(johnDoe.id);
            expect(user.name).toEqual(johnDoe.name);
            expect(user.role).toEqual(johnDoe.role);
            expect(user.password).toEqual(johnDoe.password);
        });

        it('reads "undefined" for an unknown user', async () => {
            vitest.spyOn(userStorage.userModel, 'findOne').mockReturnValue(getPromisify());
            await expect(userStorage.read('unknown@email.com')).resolves.toBe(undefined);
        });

        it('updates the data of john.doe@email.com', async () => {
            const save = vitest.fn<() => Promise<void>>();
            vitest.spyOn(userStorage.userModel, 'findOne').mockReturnValue(getPromisify(johnDoe, save));
            await userStorage.write('john.doe@email.com', { ...johnDoe });
            expect(save).toHaveBeenCalled();
        });

        it('deletes john.doe@email.com', async () => {
            vitest.spyOn(userStorage.userModel, 'findOneAndDelete').mockReturnValue(getPromisify(johnDoe));
            await expect(userStorage.delete('john.doe@email.com')).resolves.toBe(true);
        });

        function getInstance(user: UserData, save?: () => Promise<void>): UserDataInstance {
            return {
                ...user,
                save: save ?? ((): Promise<void> => new Promise<void>(resolve => resolve())),
            };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                vitest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies));
                await expect(userStorage.checkCookie('john.doe@email.com', 'Cookie1')).resolves.toBe(true);
            });

            it('indicates that "unknown" for john.doe@email.com not exist', async () => {
                vitest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies));
                await expect(userStorage.checkCookie('john.doe@email.com', 'unknown')).resolves.toBe(false);
            });

            it('indicates that "Cookie1" for jane.doe@email.com not exist', async () => {
                vitest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance());
                await expect(userStorage.checkCookie('jane.doe@email.com', 'Cookie1')).resolves.toBe(false);
            });
        });

        describe('getCookieAsync', () => {
            it('returns the value of "Cookie1" for john.doe@email.com', async () => {
                vitest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies));

                await expect(userStorage.getCookie('john.doe@email.com', 'Cookie1')).resolves.toEqual({
                    name: 'Cookie1',
                    data: 'The quick brown fox jumps over the lazy dog.',
                });
            });

            it('returns "undefined" for "unknown" for john.doe@email.com', async () => {
                vitest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies));

                await expect(userStorage.getCookie('john.doe@email.com', 'unknown')).resolves.toBeUndefined();
            });

            it('returns "undefined" for "Cookie1" for jane.doe@email.com', async () => {
                vitest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance());

                await expect(userStorage.getCookie('jane.doe@email.com', 'unknown')).resolves.toBeUndefined();
            });
        });

        describe('getCookiesAsync', () => {
            it('returns all cookies for john.doe@email.com', async () => {
                vitest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies));

                await expect(userStorage.getCookies('john.doe@email.com')).resolves.toEqual([
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
                const save = vitest.fn<() => Promise<void>>();
                vitest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies, save));

                await userStorage.setCookie('john.doe@email.com', 'Cookie3', 'Hello World!');
                expect(save).toHaveBeenCalled();
            });

            it('can update the existing Cookie2 for john.doe@email.com', async () => {
                const save = vitest.fn<() => Promise<void>>();
                vitest.spyOn(userStorage.cookieModel, 'findOne').mockReturnValue(getInstance(userCookies, save));

                await userStorage.setCookie('john.doe@email.com', 'Cookie2', 'Hello World!');
                expect(save).toHaveBeenCalled();
            });
        });

        describe('deleteCookieAsync', () => {
            it('can delete a cookie', async () => {
                const save = vitest.fn<() => Promise<void>>();
                const deleteOne = vitest.fn<() => Promise<void>>();
                vitest
                    .spyOn(userStorage.cookieModel, 'findOne')
                    .mockReturnValue(getInstance(userCookies, save, deleteOne));

                await userStorage.deleteCookie('john.doe@email.com', 'Cookie1');
                expect(save).toHaveBeenCalled();

                await userStorage.deleteCookie('john.doe@email.com', 'Cookie2');
                expect(deleteOne).toHaveBeenCalled();
            });
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function getInstance(user?: UserCookies, save?: () => Promise<void>, deleteOne?: () => Promise<void>): any {
            if (user) {
                return {
                    exec: () =>
                        new Promise<UserCookiesInstance | undefined>(resolve =>
                            resolve({
                                ...user,
                                save: save ?? ((): Promise<void> => new Promise<void>(result => result())),
                                deleteOne: deleteOne ?? ((): Promise<void> => new Promise<void>(result => result())),
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
