/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import mongoose from 'mongoose';
import { describe, beforeEach, it, expect, Mocked, vi } from 'vitest';
import { Cookie } from 'aas-core';
import { Logger, MongoDBConnectionProvider } from 'aas-package';

import { MongoDBCookieStorage } from './mongo-db-cookie-storage.js';
import { createSpyObj } from '../../test/mocks.js';
import { Variable } from '../variable.js';

vi.mock(import('mongoose'), () => {
    return {
        default: {
            connect: vi.fn().mockResolvedValue({}),
            Schema: class {},
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
});

describe('MongoDBCookieStorage', () => {
    let storage: MongoDBCookieStorage;
    let variable: Mocked<Variable>;
    let logger: Mocked<Logger>;
    let connectionProvider: Mocked<MongoDBConnectionProvider>;
    let saveMock: ReturnType<typeof vi.fn>;
    let deleteOneMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        saveMock = vi.fn().mockResolvedValue({});
        deleteOneMock = vi.fn().mockResolvedValue({});
        connectionProvider = createSpyObj<MongoDBConnectionProvider>(['getConnection']);
        connectionProvider.getConnection.mockReturnValue({
            model: vi.fn().mockReturnValue({
                findOne: vi.fn().mockImplementation(({ id }: { id: string }) => {
                    if (id === 'no.cookies@emial.com') {
                        return { exec: vi.fn().mockResolvedValue({ id: 'no.cookies@emial.com', cookies: [] }) };
                    }

                    if (id === 'john.doe@email.com') {
                        return {
                            exec: vi.fn().mockResolvedValue({
                                id: 'john.doe@emial.com',
                                cookies: [
                                    {
                                        name: 'cookie1',
                                        data: 'data',
                                    } satisfies Cookie,
                                ],
                                save: saveMock,
                                deleteOne: deleteOneMock,
                            }),
                        };
                    }

                    return { exec: vi.fn().mockResolvedValue(null) };
                }),
            }),
        } as unknown as mongoose.Connection);

        variable = createSpyObj<Variable>([], { COOKIE_STORE: 'mongodb://localhost:27017/cookies' });
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        storage = new MongoDBCookieStorage(logger, connectionProvider, variable);
    });

    it('should created', () => {
        expect(storage).toBeInstanceOf(MongoDBCookieStorage);
    });

    describe('getCookie', () => {
        it('should undefined if user does not exist', async () => {
            await expect(storage.getCookie('unknown@email.com', 'cookie1')).resolves.toBeUndefined;
        });

        it('should return false if user has no cookies', async () => {
            await expect(storage.getCookie('no.cookies@email.com', 'cookie1')).resolves.toBeUndefined();
        });

        it('should return the cookie', async () => {
            await expect(storage.getCookie('john.doe@email.com', 'cookie1')).resolves.toEqual('data');
        });
    });

    describe('setCookie', () => {
        it('should create a new cookie for existing user', async () => {
            await storage.setCookie('john.doe@email.com', 'cookie2', 'data2');
            expect(saveMock).toHaveBeenCalled();
        });

        it('should update existing cookie', async () => {
            await storage.setCookie('john.doe@email.com', 'cookie1', 'data2');
            expect(saveMock).toHaveBeenCalled();
        });
    });

    describe('deleteCookie', () => {
        it('should do nothing if user does not exist', async () => {
            await storage.deleteCookie('john.doe@email.com', 'cookie1');
            expect(deleteOneMock).toHaveBeenCalled();
        });
    });
});
