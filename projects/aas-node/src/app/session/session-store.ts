/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import session, { Cookie, SessionData } from 'express-session';
import mongoose from 'mongoose';
import { InjectionToken } from 'tsyringe';
import { Logger } from 'aas-package';
import { Variable } from '../variable';

interface ToJson {
    toJSON(value: unknown): Cookie;
}

function isToJson(value: unknown): value is ToJson {
    return value !== null && typeof value === 'object' && typeof (value as ToJson).toJSON === 'function';
}

export interface SessionDataDocument extends mongoose.Document<string> {
    _id: string;
    session: SessionData;
    lastAccessAt: Date;
}

export const SESSION_STORE = Symbol('SESSION_STORE') as InjectionToken<session.Store | undefined>;

/**
 * A custom session store implementation that uses MongoDB as the backend for storing session data.
 * This class extends the `session.Store` class from the `express-session` package and provides methods
 * for managing session data in a MongoDB collection.
 */
export class SessionStore extends session.Store {
    private readonly model: mongoose.Model<SessionDataDocument>;
    private readonly schema = new mongoose.Schema<SessionDataDocument>({
        _id: { type: String, required: true },
        session: { type: mongoose.Schema.Types.Mixed, required: false },
        lastAccessAt: { type: Date, default: Date.now },
    });

    public constructor(
        private readonly logger: Logger,
        private readonly connection: mongoose.Connection,
        private readonly variable: Variable,
    ) {
        super();

        this.schema.index({ lastAccessAt: 1 }, { expireAfterSeconds: this.variable.SESSION_TTL });
        this.model = this.connection.model<SessionDataDocument>('SessionData', this.schema);
        this.logger.info('Using MongoDB session store');
    }

    public override get(
        sessionId: string,
        callback: (err: unknown, session?: session.SessionData | null) => void,
    ): void {
        this.getSessionData(sessionId)
            .then(sessionData => {
                if (callback) {
                    callback(null, sessionData ?? null);
                }
            })
            .catch(error => {
                if (callback) {
                    callback(error);
                }
            });
    }

    public override set(sessionId: string, session: session.SessionData, callback?: (err?: unknown) => void): void {
        this.setSessionData(sessionId, session)
            .then(() => {
                if (callback) {
                    callback();
                }
            })
            .catch(error => {
                if (callback) {
                    callback(error);
                }
            });
    }

    public override destroy(sessionId: string, callback?: (err?: unknown) => void): void {
        this.deleteSessionData(sessionId)
            .then(() => {
                if (callback) {
                    callback();
                }
            })
            .catch(error => {
                if (callback) {
                    callback(error);
                }
            });
    }

    public override touch(sessionId: string, session: session.SessionData, callback?: (err?: unknown) => void): void {
        this.touchSessionData(sessionId, session)
            .then(() => {
                if (callback) {
                    callback();
                }
            })
            .catch(error => {
                if (callback) {
                    callback(error);
                }
            });
    }

    public override clear(callback?: (err?: unknown) => void): void {
        this.model
            .deleteMany({})
            .then(() => {
                if (callback) {
                    callback();
                }
            })
            .catch(error => {
                if (callback) {
                    callback(error);
                }
            });
    }

    public override length(callback: (err: unknown, length?: number) => void): void {
        this.model
            .countDocuments({})
            .then(count => {
                if (callback) {
                    callback(null, count);
                }
            })
            .catch(error => {
                if (callback) {
                    callback(error);
                }
            });
    }

    public override all(
        callback: (err: unknown, obj?: SessionData[] | { [sid: string]: SessionData } | null) => void,
    ): void {
        this.model
            .find({})
            .exec()
            .then(docs => {
                const sessions: { [sid: string]: SessionData } = {};
                for (const doc of docs) {
                    sessions[doc._id] = doc.session;
                }

                if (callback) {
                    callback(null, sessions);
                }
            })
            .catch(error => {
                if (callback) {
                    callback(error);
                }
            });
    }

    private async deleteSessionData(_id: string): Promise<void> {
        await this.model.findOneAndDelete({ _id }).exec();
    }

    private async getSessionData(_id: string): Promise<SessionData | undefined> {
        return (await this.model.findOne({ _id }).exec())?.session;
    }

    private async setSessionData(_id: string, data: SessionData): Promise<void> {
        const cookie = isToJson(data.cookie) ? data.cookie.toJSON(data.cookie) : data.cookie;
        const ttl = this.getTTL(data);
        if (ttl <= 0) {
            await this.deleteSessionData(_id);
            return;
        }

        await this.model
            .findOneAndUpdate(
                { _id },
                { _id, session: { ...data, cookie }, lastAccessAt: new Date() },
                { upsert: true },
            )
            .exec();
    }

    private async touchSessionData(_id: string, data: SessionData): Promise<void> {
        const cookie = isToJson(data.cookie) ? data.cookie.toJSON(data.cookie) : data.cookie;

        await this.model
            .findOneAndUpdate(
                { _id },
                { _id, session: { ...data, cookie }, lastAccessAt: new Date() },
                { returnDocument: 'after' },
            )
            .exec();
    }

    private getTTL(data: SessionData): number {
        let ttl;
        if (data?.cookie?.expires) {
            const ms = Number(new Date(data.cookie.expires)) - Date.now();
            ttl = Math.ceil(ms / 1000);
        } else {
            ttl = this.variable.SESSION_TTL;
        }

        return ttl;
    }
}
