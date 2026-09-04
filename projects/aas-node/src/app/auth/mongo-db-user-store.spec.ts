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
import { LOGGER, Logger, MongoDBConnectionProvider } from 'aas-package';
import { container } from 'tsyringe';

import { MongoDBUserStore } from './mongo-db-user-store.js';
import { createSpyObj } from '../../test/mocks.js';
import { Variable } from '../variable.js';
import { USER_STORE } from './user-store.js';

vi.mock(import('mongoose'), () => {
    return {
        default: {
            connect: vi.fn().mockResolvedValue({}),
            Schema: class {},
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
});

describe('MongoDBUserStore', () => {
    let userStore: MongoDBUserStore;
    let connectionProvider: Mocked<MongoDBConnectionProvider>;
    let saveMock: ReturnType<typeof vi.fn>;
    let findOneMock: ReturnType<typeof vi.fn>;
    let findOneAndDeleteMock: ReturnType<typeof vi.fn>;
    let userModelMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        saveMock = vi.fn().mockResolvedValue({});
        findOneMock = vi.fn();
        findOneAndDeleteMock = vi.fn();
        userModelMock = vi.fn().mockImplementation(function (data) {
            return { ...data, save: saveMock };
        });
        Object.assign(userModelMock, {
            findOne: findOneMock,
            findOneAndDelete: findOneAndDeleteMock,
        });
        connectionProvider = createSpyObj<MongoDBConnectionProvider>(['getConnection']);
        connectionProvider.getConnection.mockReturnValue({
            model: vi.fn().mockReturnValue(userModelMock),
        } as unknown as mongoose.Connection);

        container.clearInstances();
        container.registerInstance(MongoDBConnectionProvider, connectionProvider);
        container.registerInstance(LOGGER, createSpyObj<Logger>(['error', 'warning', 'info']));
        container.register(USER_STORE, { useClass: MongoDBUserStore });
        container.registerInstance(
            Variable,
            createSpyObj<Variable>([], { IDENTITY_PROVIDER: 'mongodb://localhost:27017/cookies' }),
        );

        userStore = container.resolve(USER_STORE) as MongoDBUserStore;
    });

    afterEach(() => {
        vitest.restoreAllMocks();
    });

    it('should created', () => {
        expect(userStore).toBeInstanceOf(MongoDBUserStore);
    });

    it('retrieves a user when it exists', async () => {
        const user = {
            id: 'john.doe@email.com',
            name: 'John Doe',
            password: 'password-hash',
            created: new Date('2026-08-28T12:00:00.000Z'),
        };
        findOneMock.mockReturnValue({ exec: vi.fn().mockResolvedValue(user) });

        await expect(userStore.get(user.id)).resolves.toBe(user);
        expect(findOneMock).toHaveBeenCalledWith({ id: user.id });
    });

    it('returns undefined when a user does not exist', async () => {
        findOneMock.mockReturnValue({ exec: vi.fn().mockResolvedValue(null) });

        await expect(userStore.get('missing@email.com')).resolves.toBeUndefined();
    });

    it('updates an existing user', async () => {
        const existingUser = {
            id: 'john.doe@email.com',
            name: 'John Doe',
            password: 'old-password-hash',
            created: new Date('2026-08-28T12:00:00.000Z'),
            save: saveMock,
        };
        findOneMock.mockReturnValue({ exec: vi.fn().mockResolvedValue(existingUser) });
        const data = { ...existingUser, name: 'Jane Doe', password: 'new-password-hash' };

        await userStore.set(existingUser.id, data);

        expect(existingUser).toMatchObject({ name: data.name, password: data.password });
        expect(saveMock).toHaveBeenCalledOnce();
        expect(userModelMock).not.toHaveBeenCalled();
    });

    it('creates a user when it does not exist', async () => {
        const data = {
            id: 'john.doe@email.com',
            name: 'John Doe',
            password: 'password-hash',
            created: new Date('2026-08-28T12:00:00.000Z'),
        };
        findOneMock.mockReturnValue({ exec: vi.fn().mockResolvedValue(null) });

        await userStore.set(data.id, data);

        expect(userModelMock).toHaveBeenCalledWith(data);
        expect(saveMock).toHaveBeenCalledOnce();
    });

    it.each([
        ['deletes an existing user', { id: 'john.doe@email.com' }, true],
        ['returns false when deleting a missing user', null, false],
    ])('%s', async (_description, document, expected) => {
        findOneAndDeleteMock.mockReturnValue({ exec: vi.fn().mockResolvedValue(document) });

        await expect(userStore.delete('john.doe@email.com')).resolves.toBe(expected);
        expect(findOneAndDeleteMock).toHaveBeenCalledWith({ id: 'john.doe@email.com' });
    });
});
