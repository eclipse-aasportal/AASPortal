/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { beforeEach, afterEach, describe, Mocked, vi, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { LOGGER, Logger, MongoDBConnectionProvider } from 'aas-package';
import { SessionData } from 'express-session';

import { SessionDataDocument, MongoDbSessionStore } from './mongo-db-session-store.js';
import { createSpyObj } from '../../test/mocks.js';
import { Variable } from '../variable.js';

vi.mock(import('mongoose'), () => {
    return {
        default: {
            connect: vi.fn().mockResolvedValue({}),
            Schema: class {
                public static Types = {
                    Mixed: class {},
                };

                public index = vi.fn();
            },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
});

describe('MongoDbSessionStore', () => {
    let store: MongoDbSessionStore;
    let logger: Mocked<Logger>;
    let connectionProvider: Mocked<MongoDBConnectionProvider>;
    let connection: Mocked<mongoose.Connection>;
    let variable: Mocked<Variable>;
    let model: Mocked<mongoose.Model<SessionDataDocument>>;
    let modelConstructor: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['info', 'warning', 'error']);
        connection = createSpyObj<mongoose.Connection>(['model', 'close']);
        variable = createSpyObj<Variable>([], { SESSION_TTL: 86400 });
        modelConstructor = vi.fn(function (this: SessionDataDocument, data: Partial<SessionDataDocument>) {
            Object.assign(this, data);
            this.save = vi.fn().mockResolvedValue(this);
        });

        Object.assign(
            modelConstructor,
            createSpyObj<mongoose.Model<SessionDataDocument>>([
                'find',
                'findOne',
                'deleteMany',
                'findOneAndDelete',
                'findOneAndUpdate',
                'countDocuments',
            ]),
        );

        model = modelConstructor as unknown as Mocked<mongoose.Model<SessionDataDocument>>;
        connection.model.mockReturnValue(model as unknown as mongoose.Model<unknown>);
        connectionProvider = createSpyObj<MongoDBConnectionProvider>(['getConnection']);
        connectionProvider.getConnection.mockReturnValue(connection);

        container.clearInstances();
        container.registerInstance(LOGGER, logger);
        container.registerInstance(MongoDBConnectionProvider, connectionProvider);
        container.registerInstance(Variable, variable);
        container.registerSingleton(MongoDbSessionStore);
        store = container.resolve(MongoDbSessionStore);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create', () => {
        expect(store).toBeInstanceOf(MongoDbSessionStore);
    });

    describe('get', () => {
        it('should get session data', async () => {
            const sessionId = 'session-id';
            const sessionData: SessionData = {
                cookie: {
                    originalMaxAge: 1000,
                    expires: new Date(),
                    secure: false,
                    httpOnly: true,
                    domain: 'example.com',
                },
                user_id: 'user-id',
                state: 'state',
                code_verifier: 'code_verifier',
                endpoints: [],
                access_token: 'access_token',
                refresh_token: 'refresh_token',
                expires_at: 1234567890,
                session_state: 'session_state',
                check_session_iframe: 'check_session_iframe',
                name: 'John Doe',
                role: 'user',
            };

            const doc = createSpyObj<SessionDataDocument>(['toObject'], {
                _id: sessionId,
                session: sessionData,
            });

            const query = createSpyObj<mongoose.Query<SessionDataDocument | null, SessionDataDocument>>(['exec'], {});
            query.exec.mockResolvedValue(doc);
            model.findOne.mockReturnValue(query as unknown as ReturnType<typeof model.findOne>);

            const data = await new Promise<SessionData | null | undefined>(resolve => {
                store.get(sessionId, (_, data) => {
                    resolve(data);
                });
            });

            expect(data).toEqual(sessionData);
        });

        it('should return null if session data not found', async () => {
            const sessionId = 'session-id';
            const query = createSpyObj<mongoose.Query<SessionDataDocument | null, SessionDataDocument>>(['exec'], {});
            query.exec.mockResolvedValue(null);
            model.findOne.mockReturnValue(query as unknown as ReturnType<typeof model.findOne>);

            const data = await new Promise(resolve => {
                store.get(sessionId, (_, data) => {
                    resolve(data);
                });
            });

            expect(data).toBeNull();
        });
    });

    describe('set', () => {
        it('should create new session data', async () => {
            const sessionId = 'session-id';
            const sessionData: SessionData = {
                cookie: {
                    originalMaxAge: 1000,
                    expires: new Date(Date.now() + 1000),
                    secure: false,
                    httpOnly: true,
                    domain: 'example.com',
                },
                user_id: 'user-id',
                name: 'John Doe',
                role: 'user',
                state: 'state',
                code_verifier: 'code_verifier',
                endpoints: [],
                access_token: 'access_token',
                refresh_token: 'refresh_token',
                expires_at: 1234567890,
                session_state: 'session_state',
                check_session_iframe: 'check_session_iframe',
            };

            const query = createSpyObj<mongoose.Query<SessionDataDocument | null, SessionDataDocument>>(['exec'], {});
            query.exec.mockResolvedValue(null);
            model.findOneAndUpdate.mockReturnValue(query as unknown as ReturnType<typeof model.findOneAndReplace>);

            await new Promise<void>((resolve, reject) => {
                store.set(sessionId, sessionData, err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            expect(model.findOneAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ _id: sessionId }),
                expect.objectContaining({ _id: sessionId, session: expect.objectContaining(sessionData) }),
                { upsert: true },
            );
        });

        it('should update existing session data', async () => {
            const sessionId = 'session-id';
            const sessionData: SessionData = {
                cookie: {
                    originalMaxAge: 1000,
                    expires: new Date(),
                    secure: false,
                    httpOnly: true,
                    domain: 'example.com',
                },
                user_id: 'user-id',
                name: 'John Doe',
                role: 'user',
                state: 'state',
                code_verifier: 'code_verifier',
                endpoints: [],
                access_token: 'access_token',
                refresh_token: 'refresh_token',
                expires_at: 1234567890,
                session_state: 'session_state',
                check_session_iframe: 'check_session_iframe',
            };

            const existingSessionData: SessionData = {
                cookie: {
                    originalMaxAge: 1000,
                    expires: new Date(),
                    secure: false,
                    httpOnly: true,
                    domain: 'example.com',
                },
                user_id: 'user-id',
                name: 'John Doe',
                role: 'user',
                state: 'old-state',
                code_verifier: 'old-code_verifier',
                endpoints: [],
                access_token: 'old-access_token',
                refresh_token: 'old-refresh_token',
                expires_at: 9876543210,
                session_state: 'old-session_state',
                check_session_iframe: 'old-check_session_iframe',
            };

            const existingDoc = createSpyObj<SessionDataDocument>(['save'], {
                _id: sessionId,
                session: existingSessionData,
            });

            existingDoc.save.mockReturnThis();

            store['getTTL'] = vi.fn().mockReturnValue(1000);
            const query = createSpyObj<mongoose.Query<SessionDataDocument | null, SessionDataDocument>>(['exec'], {});
            query.exec.mockResolvedValue(existingDoc);
            model.findOneAndUpdate.mockReturnValue(query as unknown as ReturnType<typeof model.findOneAndUpdate>);

            await new Promise<void>((resolve, reject) => {
                store.set(sessionId, sessionData, err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    });

    describe('touch', () => {
        it('should update lastAccessAt for existing session data', async () => {
            const sessionId = 'session-id';
            const sessionData: SessionData = {
                cookie: {
                    originalMaxAge: 1000,
                    expires: new Date(),
                    secure: false,
                    httpOnly: true,
                    domain: 'example.com',
                },
                user_id: 'user-id',
                name: 'John Doe',
                role: 'user',
                state: 'state',
                code_verifier: 'code_verifier',
                endpoints: [],
                access_token: 'access_token',
                refresh_token: 'refresh_token',
                expires_at: 1234567890,
                session_state: 'session_state',
                check_session_iframe: 'check_session_iframe',
            };

            const query = createSpyObj<mongoose.Query<SessionDataDocument | null, SessionDataDocument>>(['exec'], {});
            query.exec.mockResolvedValue(null);
            model.findOneAndUpdate.mockReturnValue(query as unknown as ReturnType<typeof model.findOneAndUpdate>);

            await new Promise<void>((resolve, reject) => {
                store.touch(sessionId, sessionData, err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            expect(model.findOneAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ _id: sessionId }),
                expect.objectContaining({ _id: sessionId, session: expect.objectContaining(sessionData) }),
                { returnDocument: 'after' },
            );
        });
    });

    describe('destroy', () => {
        it('should destroy session data', async () => {
            const sessionId = 'session-id';
            const query = createSpyObj<mongoose.Query<SessionDataDocument | null, SessionDataDocument>>(['exec'], {});
            query.exec.mockResolvedValue(null);
            model.findOneAndDelete.mockReturnValue(query as unknown as ReturnType<typeof model.findOneAndDelete>);
            await new Promise<void>((resolve, reject) => {
                store.destroy(sessionId, err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    });

    describe('length', () => {
        it('should return the length of the session store', async () => {
            const count = 5;
            model.countDocuments.mockReturnValue(
                Promise.resolve(count) as unknown as ReturnType<typeof model.countDocuments>,
            );

            const length = await new Promise<number>((resolve, reject) => {
                store.length((err, length) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(length ?? 0);
                    }
                });
            });

            expect(length).toBe(count);
        });
    });

    describe('all', () => {
        it('should return all session data', async () => {
            const sessionDoc1 = createSpyObj<SessionDataDocument>(['toObject'], {
                _id: 'session-id-1',
                session: {
                    cookie: {
                        originalMaxAge: 1000,
                        expires: new Date(),
                        secure: false,
                        httpOnly: true,
                        domain: 'example.com',
                    },
                    user_id: 'user-id-1',
                    name: 'John Doe',
                    role: 'user',
                    state: 'state-1',
                    code_verifier: 'code_verifier-1',
                    endpoints: [],
                    access_token: 'access_token-1',
                    refresh_token: 'refresh_token-1',
                    expires_at: 1234567890,
                    session_state: 'session_state-1',
                    check_session_iframe: 'check_session_iframe-1',
                },
            });

            const sessionDoc2 = createSpyObj<SessionDataDocument>(['toObject'], {
                _id: 'session-id-2',
                session: {
                    cookie: {
                        originalMaxAge: 2000,
                        expires: new Date(),
                        secure: false,
                        httpOnly: true,
                        domain: 'example.com',
                    },
                    user_id: 'user-id-2',
                    name: 'John Doe',
                    role: 'user',
                    state: 'state-2',
                    code_verifier: 'code_verifier-2',
                    endpoints: [],
                    access_token: 'access_token-2',
                    refresh_token: 'refresh_token-2',
                    expires_at: 9876543210,
                    session_state: 'session_state-2',
                    check_session_iframe: 'check_session_iframe-2',
                },
            });

            const query = createSpyObj<mongoose.Query<SessionDataDocument[], SessionDataDocument>>(['exec'], {});
            query.exec.mockResolvedValue([sessionDoc1, sessionDoc2]);
            model.find = vi.fn().mockReturnValue(query as unknown as ReturnType<typeof model.find>);

            const allSessions = await new Promise<unknown>((resolve, reject) => {
                store.all((err, sessions) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(sessions ?? {});
                    }
                });
            });

            expect(allSessions).toEqual({
                'session-id-1': sessionDoc1.session,
                'session-id-2': sessionDoc2.session,
            });
        });
    });

    describe('clear', () => {
        it('should clear all session data', async () => {
            const query = createSpyObj<mongoose.Query<SessionDataDocument[], SessionDataDocument>>(['exec'], {});
            query.exec.mockResolvedValue([]);
            model.deleteMany = vi.fn().mockResolvedValue(query as unknown as ReturnType<typeof model.deleteMany>);

            await new Promise<void>((resolve, reject) => {
                store.clear(err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    });
});
