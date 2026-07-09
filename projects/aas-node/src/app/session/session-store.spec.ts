/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, afterEach, describe, Mocked, vi, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { Logger } from 'aas-package';

import { SessionDataDocument, SessionStore } from './session-store';
import { createSpyObj } from '../../test/mocks';
import { SessionData } from 'express-session';

vi.mock(import('mongoose'), () => {
    return {
        default: {
            connect: vi.fn().mockResolvedValue({}),
            Schema: class {
                public static Types = {
                    Mixed: class {},
                };
            },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
});

describe('SessionStore', () => {
    let store: SessionStore;
    let logger: Mocked<Logger>;
    let connection: Mocked<mongoose.Connection>;
    let model: Mocked<mongoose.Model<SessionDataDocument>>;
    let modelConstructor: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['info', 'warning', 'error']);
        connection = createSpyObj<mongoose.Connection>(['model', 'close']);
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
                'deleteOne',
                'countDocuments',
            ]),
        );

        model = modelConstructor as unknown as Mocked<mongoose.Model<SessionDataDocument>>;
        connection.model.mockReturnValue(model as unknown as mongoose.Model<unknown>);
        store = new SessionStore(logger, connection);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create', () => {
        expect(store).toBeInstanceOf(SessionStore);
    });

    describe('get', () => {
        it('should get session data', async () => {
            const sessionId = 'session-id';
            const sessionData = {
                cookie: {
                    originalMaxAge: 1000,
                    expires: new Date(),
                    secure: false,
                    httpOnly: true,
                    domain: 'example.com',
                },
                state: 'state',
                code_verifier: 'code_verifier',
                endpoints: [],
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
                    expires: new Date(),
                    secure: false,
                    httpOnly: true,
                    domain: 'example.com',
                },
                state: 'state',
                code_verifier: 'code_verifier',
                endpoints: [],
            };

            const query = createSpyObj<mongoose.Query<SessionDataDocument | null, SessionDataDocument>>(['exec'], {});
            query.exec.mockResolvedValue(null);
            model.findOne.mockReturnValue(query as unknown as ReturnType<typeof model.findOne>);

            await new Promise<void>((resolve, reject) => {
                store.set(sessionId, sessionData, err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            expect(modelConstructor).toHaveBeenCalledWith(expect.objectContaining({ _id: sessionId }));
            const createdDoc = modelConstructor.mock.instances[0];
            expect(createdDoc.save).toHaveBeenCalledOnce();
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
                state: 'state',
                code_verifier: 'code_verifier',
                endpoints: [],
            };

            const existingSessionData: SessionData = {
                cookie: {
                    originalMaxAge: 1000,
                    expires: new Date(),
                    secure: false,
                    httpOnly: true,
                    domain: 'example.com',
                },
                state: 'old-state',
                code_verifier: 'old-code_verifier',
                endpoints: [],
            };

            const existingDoc = createSpyObj<SessionDataDocument>(['save'], {
                _id: sessionId,
                session: existingSessionData,
            });

            existingDoc.save.mockReturnThis();

            store['getTTL'] = vi.fn().mockReturnValue(1000);
            const query = createSpyObj<mongoose.Query<SessionDataDocument | null, SessionDataDocument>>(['exec'], {});
            query.exec.mockResolvedValue(existingDoc);
            model.findOne.mockReturnValue(query as unknown as ReturnType<typeof model.findOne>);
            model.deleteOne.mockReturnValue(Promise.resolve() as unknown as ReturnType<typeof model.deleteOne>);

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

    describe('destroy', () => {
        it('should destroy session data', async () => {
            const sessionId = 'session-id';
            const query = createSpyObj<mongoose.Query<SessionDataDocument | null, SessionDataDocument>>(['exec'], {});
            query.exec.mockResolvedValue(null);
            model.findOne.mockReturnValue(query as unknown as ReturnType<typeof model.findOne>);

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
                    state: 'state-1',
                    code_verifier: 'code_verifier-1',
                    endpoints: [],
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
                    state: 'state-2',
                    code_verifier: 'code_verifier-2',
                    endpoints: [],
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
