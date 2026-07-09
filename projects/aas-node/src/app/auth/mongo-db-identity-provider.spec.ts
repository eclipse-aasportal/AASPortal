/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, afterEach, vitest, Mocked, vi } from 'vitest';
import mongoose from 'mongoose';
import { Logger, MongoDBConnectionProvider } from 'aas-package';

import { MongoDBIdentityProvider } from './mongo-db-identity-provider.js';
import { createSpyObj } from '../../test/mocks.js';
import { Variable } from '../variable.js';
import { CookieStorage } from '../cookie-storage/cookie-storage.js';

vi.mock(import('mongoose'), () => {
    return {
        default: {
            connect: vi.fn().mockResolvedValue({}),
            Schema: class {},
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
});

describe('MongoDBIdentityProvider', () => {
    let identityProvider: MongoDBIdentityProvider;
    let variable: Mocked<Variable>;
    let logger: Mocked<Logger>;
    let cookies: Mocked<CookieStorage>;
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
                    if (id === 'john.doe@email.com') {
                        return {
                            exec: vi.fn().mockResolvedValue({
                                id: 'john.doe@emial.com',
                                name: 'John Doe',
                                role: 'editor',
                                password: '$2a$10$6qZT2ZM5jUVU/pLLQUjCvuXplG.GwPnoz48C1Eg/dKqjIrGE8jm0a',
                                save: saveMock,
                                deleteOne: deleteOneMock,
                            }),
                        };
                    }

                    return { exec: vi.fn().mockResolvedValue(null) };
                }),
            }),
        } as unknown as mongoose.Connection);

        variable = createSpyObj<Variable>([], { IDENTITY_PROVIDER: 'mongodb://localhost:27017/cookies' });
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        cookies = createSpyObj<CookieStorage>(['getCookie', 'setCookie', 'getEndpoints']);
        identityProvider = new MongoDBIdentityProvider(logger, cookies, variable, connectionProvider);
    });

    afterEach(() => {
        vitest.restoreAllMocks();
    });

    it('should created', () => {
        expect(identityProvider).toBeInstanceOf(MongoDBIdentityProvider);
    });
});
