/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { beforeEach, afterEach, describe, it, expect, vi, Mock, Mocked } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { LOGGER, Logger } from 'aas-package';
import { container } from 'tsyringe';
import { SessionData } from 'express-session';

import { SqliteSessionStore } from './sqlite-session-store.js';
import { SqliteConnectionProvider } from '../sqlite-connection-provider.js';
import { Variable } from '../variable.js';
import { createSpyObj } from '../../test/mocks.js';

describe('SqliteSessionStore', () => {
    let store: SqliteSessionStore;
    let logger: Mocked<Logger>;
    let connectionProvider: Mocked<SqliteConnectionProvider>;
    let variable: Mocked<Variable>;
    let db: DatabaseSync;

    type StoreInternals = {
        getSessionData: (sessionId: string) => SessionData | undefined;
        setSessionData: (sessionId: string, sessionData: SessionData) => void;
        deleteSessionData: (sessionId: string) => void;
        touchSessionData: (sessionId: string, sessionData: SessionData) => void;
        getCountSql: { get: () => unknown };
        getSessionsSql: { all: () => unknown };
    };

    beforeEach(() => {
        logger = createSpyObj<Logger>(['info', 'warning', 'error']);
        connectionProvider = createSpyObj<SqliteConnectionProvider>(['getConnection']);
        variable = createSpyObj<Variable>([], { SESSION_TTL: 86400, SESSION_STORE: ':memory:' });

        // Create an in-memory SQLite database for testing
        db = new DatabaseSync(':memory:');

        connectionProvider.getConnection.mockReturnValue(db);

        container.clearInstances();
        container.registerInstance(LOGGER, logger);
        container.registerInstance(SqliteConnectionProvider, connectionProvider);
        container.registerInstance(Variable, variable);
        container.registerSingleton(SqliteSessionStore);
        store = container.resolve(SqliteSessionStore);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        db.close();
    });

    function createSessionData(overrides: Partial<SessionData> = {}): SessionData {
        return {
            cookie: {
                originalMaxAge: 1000,
                expires: new Date(Date.now() + 60_000),
                secure: false,
                httpOnly: true,
                domain: 'example.com',
            },
            user_id: 'user-id',
            name: 'John Doe',
            role: 'user',
            state: 'state',
            code_verifier: 'code-verifier',
            endpoints: [],
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expires_at: 1234567890,
            session_state: 'session-state',
            check_session_iframe: 'https://example.com/session',
            ...overrides,
        };
    }

    function setSession(sessionId: string, sessionData: SessionData): Promise<void> {
        return new Promise((resolve, reject) => {
            store.set(sessionId, sessionData, error => (error ? reject(error) : resolve()));
        });
    }

    function getSession(sessionId: string): Promise<SessionData | null | undefined> {
        return new Promise((resolve, reject) => {
            store.get(sessionId, (error, sessionData) => (error ? reject(error) : resolve(sessionData)));
        });
    }

    function asStoredSessionData(sessionData: SessionData): SessionData {
        return {
            ...sessionData,
            cookie: {
                ...sessionData.cookie,
                expires: sessionData.cookie.expires?.toISOString(),
            },
        } as unknown as SessionData;
    }

    it('should create', () => {
        expect(store).toBeInstanceOf(SqliteSessionStore);
        expect(logger.info).toHaveBeenCalledWith('Using SQLite session store ":memory:"');
    });

    it('should create and retrieve session data', async () => {
        const sessionData = createSessionData();

        await setSession('session-id', sessionData);

        expect(await getSession('session-id')).toEqual(asStoredSessionData(sessionData));
    });

    it('should return null when session data is not found', async () => {
        expect(await getSession('missing-session')).toBeNull();
    });

    it('should update existing session data', async () => {
        await setSession('session-id', createSessionData({ state: 'old-state' }));
        const updatedSession = createSessionData({ state: 'new-state', user_id: 'new-user-id' });

        await setSession('session-id', updatedSession);

        expect(await getSession('session-id')).toEqual(asStoredSessionData(updatedSession));
        expect(db.prepare('SELECT COUNT(*) AS count FROM sessionData').get()).toEqual({ count: 1 });
    });

    it('should serialize cookie objects with toJSON', async () => {
        const sessionData = createSessionData({
            cookie: {
                toJSON: vi.fn().mockReturnValue({ secure: true, httpOnly: false }),
            } as unknown as SessionData['cookie'],
        });

        await setSession('session-id', sessionData);

        expect((sessionData.cookie as unknown as { toJSON: Mock }).toJSON).toHaveBeenCalledWith(sessionData.cookie);
        expect(await getSession('session-id')).toEqual({
            ...sessionData,
            cookie: { secure: true, httpOnly: false },
        });
    });

    it('should remove session data whose TTL has expired', async () => {
        await setSession('session-id', createSessionData());
        const sessionData = createSessionData();
        sessionData.cookie.expires = new Date(Date.now() - 1);
        await setSession('session-id', sessionData);

        expect(await getSession('session-id')).toBeNull();
    });

    it('should update session data when touched', async () => {
        await setSession('session-id', createSessionData({ state: 'old-state' }));
        const sessionData = createSessionData({ state: 'touched-state' });

        await new Promise<void>((resolve, reject) => {
            store.touch('session-id', sessionData, error => (error ? reject(error) : resolve()));
        });

        expect(await getSession('session-id')).toEqual(asStoredSessionData(sessionData));
    });

    it('should destroy session data', async () => {
        await setSession('session-id', createSessionData());

        await new Promise<void>((resolve, reject) => {
            store.destroy('session-id', error => (error ? reject(error) : resolve()));
        });

        expect(await getSession('session-id')).toBeNull();
    });

    it('should report the number of stored sessions', async () => {
        await setSession('session-id-1', createSessionData());
        await setSession('session-id-2', createSessionData());

        const length = await new Promise<number>((resolve, reject) => {
            store.length((error, value) => (error ? reject(error) : resolve(value ?? 0)));
        });

        expect(length).toBe(2);
    });

    it('should return all stored sessions', async () => {
        const sessionData1 = createSessionData({ state: 'state-1' });
        const sessionData2 = createSessionData({ state: 'state-2' });
        await setSession('session-id-1', sessionData1);
        await setSession('session-id-2', sessionData2);

        const sessions = await new Promise<unknown>((resolve, reject) => {
            store.all((error, value) => (error ? reject(error) : resolve(value)));
        });

        expect(sessions).toEqual({
            'session-id-1': asStoredSessionData(sessionData1),
            'session-id-2': asStoredSessionData(sessionData2),
        });
    });

    it('should clear all session data', async () => {
        await setSession('session-id-1', createSessionData());
        await setSession('session-id-2', createSessionData());

        await new Promise<void>((resolve, reject) => {
            store.clear(error => (error ? reject(error) : resolve()));
        });

        const length = await new Promise<number>((resolve, reject) => {
            store.length((error, value) => (error ? reject(error) : resolve(value ?? 0)));
        });
        expect(length).toBe(0);
    });

    it.each([
        [
            'get',
            (error: Error): void =>
                void vi.spyOn(store as unknown as StoreInternals, 'getSessionData').mockImplementation(() => {
                    throw error;
                }),
        ],
        [
            'set',
            (error: Error): void =>
                void vi.spyOn(store as unknown as StoreInternals, 'setSessionData').mockImplementation(() => {
                    throw error;
                }),
        ],
        [
            'destroy',
            (error: Error): void =>
                void vi.spyOn(store as unknown as StoreInternals, 'deleteSessionData').mockImplementation(() => {
                    throw error;
                }),
        ],
        [
            'touch',
            (error: Error): void =>
                void vi.spyOn(store as unknown as StoreInternals, 'touchSessionData').mockImplementation(() => {
                    throw error;
                }),
        ],
        [
            'clear',
            (error: Error): void =>
                void vi.spyOn(db, 'exec').mockImplementation(() => {
                    throw error;
                }),
        ],
        [
            'length',
            (error: Error): void =>
                void vi.spyOn((store as unknown as StoreInternals).getCountSql, 'get').mockImplementation(() => {
                    throw error;
                }),
        ],
        [
            'all',
            (error: Error): void =>
                void vi.spyOn((store as unknown as StoreInternals).getSessionsSql, 'all').mockImplementation(() => {
                    throw error;
                }),
        ],
    ])('should forward errors from %s to its callback', (method, mockError: (error: Error) => void) => {
        const error = new Error('failed');
        mockError(error);
        const callback = vi.fn();

        switch (method) {
            case 'get':
                store.get('session-id', callback);
                break;
            case 'set':
                store.set('session-id', createSessionData(), callback);
                break;
            case 'destroy':
                store.destroy('session-id', callback);
                break;
            case 'touch':
                store.touch('session-id', createSessionData(), callback);
                break;
            case 'clear':
                store.clear(callback);
                break;
            case 'length':
                store.length(callback);
                break;
            case 'all':
                store.all(callback);
                break;
        }

        expect(callback).toHaveBeenCalledWith(error);
    });
});
