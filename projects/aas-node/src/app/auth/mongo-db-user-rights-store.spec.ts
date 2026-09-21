/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it, vi, vitest } from 'vitest';
import mongoose from 'mongoose';
import { container } from 'tsyringe';
import { LOGGER, Logger, MongoDBConnectionProvider } from 'aas-package';

import { MongoDBUserRightsStore } from './mongo-db-user-rights-store.js';
import { createSpyObj } from '../../test/mocks.js';
import { Variable } from '../variable.js';
import { UserRights } from './user-rights-store.js';

vi.mock(
    import('mongoose'),
    () =>
        ({
            default: {
                Schema: class {},
                connect: vi.fn().mockResolvedValue({}),
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
);

describe('MongoDBUserRightsStore', () => {
    let store: MongoDBUserRightsStore;
    let findOneMock: ReturnType<typeof vi.fn>;
    let updateOneMock: ReturnType<typeof vi.fn>;
    let deleteOneMock: ReturnType<typeof vi.fn>;
    let saveMock: ReturnType<typeof vi.fn>;
    let userRightsModelMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        findOneMock = vi.fn();
        updateOneMock = vi.fn();
        deleteOneMock = vi.fn();
        saveMock = vi.fn().mockResolvedValue({});
        userRightsModelMock = vi.fn().mockImplementation(function (data) {
            return { ...data, save: saveMock };
        });
        Object.assign(userRightsModelMock, {
            findOne: findOneMock,
            updateOne: updateOneMock,
            deleteOne: deleteOneMock,
        });

        const connectionProvider = createSpyObj<MongoDBConnectionProvider>(['getConnection']);
        connectionProvider.getConnection.mockReturnValue({
            model: vi.fn().mockReturnValue(userRightsModelMock),
        } as unknown as mongoose.Connection);

        container.clearInstances();
        container.registerInstance(MongoDBConnectionProvider, connectionProvider);
        container.registerInstance(LOGGER, createSpyObj<Logger>(['error', 'warning', 'info']));
        container.registerInstance(
            Variable,
            createSpyObj<Variable>([], { USER_RIGHTS_STORE: 'mongodb://localhost:27017/users' }),
        );

        store = container.resolve(MongoDBUserRightsStore);
    });

    afterEach(() => {
        vitest.restoreAllMocks();
    });

    it('returns "viewer" rights when no persisted rights exist', async () => {
        findOneMock.mockReturnValue({ exec: vi.fn().mockResolvedValue(null) });
        await expect(store.getRole('missing@example.com')).resolves.toEqual('viewer');
    });

    it('adds, retrieves, updates, and deletes user rights', async () => {
        const userRights: UserRights = { id: 'user@example.com', role: 'viewer', endpoints: [] };

        findOneMock.mockReturnValue({ exec: vi.fn().mockResolvedValue(userRights) });
        updateOneMock.mockReturnValue({ exec: vi.fn().mockResolvedValue({}) });
        deleteOneMock.mockReturnValue({ exec: vi.fn().mockResolvedValue({}) });

        await store.add(userRights.id, { role: userRights.role, endpoints: [] });
        await expect(store.getRole(userRights.id)).resolves.toBe('viewer');
        await store.update(userRights.id, { role: 'admin' });
        await store.delete(userRights.id);

        expect(userRightsModelMock).toHaveBeenCalledWith(userRights);
        expect(saveMock).toHaveBeenCalledOnce();
        expect(updateOneMock).toHaveBeenCalledWith({ id: userRights.id }, { role: 'admin' });
        expect(deleteOneMock).toHaveBeenCalledWith({ id: userRights.id });
    });

    it('should add, retrieve, update user specific AAS Endpoint authentication', async () => {
        const userRights: UserRights = { id: 'user@example.com', role: 'viewer', endpoints: [] };

        findOneMock.mockReturnValue({ exec: vi.fn().mockResolvedValue(userRights) });
        updateOneMock.mockReturnValue({ exec: vi.fn().mockResolvedValue({}) });
        deleteOneMock.mockReturnValue({ exec: vi.fn().mockResolvedValue({}) });

        await store.add(userRights.id, { role: userRights.role, endpoints: [] });
        await expect(store.getRole(userRights.id)).resolves.toBe('viewer');
        await store.update(userRights.id, { endpoints: [{ name: 'Endpoint 1', headers: { header: 'value' } }] });

        expect(userRightsModelMock).toHaveBeenCalledWith(userRights);
        expect(saveMock).toHaveBeenCalledOnce();
        expect(updateOneMock).toHaveBeenCalledWith(
            { id: userRights.id },
            { endpoints: [{ name: 'Endpoint 1', headers: { header: 'value' } }] },
        );
    });

    it('does not update when the role is omitted', async () => {
        await store.update('user@example.com', {});

        expect(updateOneMock).not.toHaveBeenCalled();
    });
});
