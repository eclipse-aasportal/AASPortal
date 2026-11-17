/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DatabaseSync, StatementSync } from 'node:sqlite';
import session from 'express-session';
import { container, singleton } from 'tsyringe';
import { LOGGER } from 'aas-package';

import { SqliteConnectionProvider } from '../sqlite-connection-provider.js';
import { isToJson, SessionStore } from './session-store.js';

const initDatabase = `
CREATE TABLE IF NOT EXISTS sessionData (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    session TEXT NOT NULL,
    lastAccessAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lastAccessAt ON sessionData(lastAccessAt);
`;

/**
 * A custom session store implementation that uses SQLite as the backend for storing session data.
 * This class extends the `SessionStore` class and provides methods for managing session data in a SQLite database.
 */
@singleton()
export class SqliteSessionStore extends SessionStore {
    private readonly logger = container.resolve(LOGGER);
    private readonly connectionProvider = container.resolve(SqliteConnectionProvider);
    private readonly db: DatabaseSync;
    private readonly getCountSql: StatementSync;
    private readonly getSessionsSql: StatementSync;
    private readonly deleteSessionSql: StatementSync;
    private readonly getSessionSql: StatementSync;
    private readonly setSessionSql: StatementSync;
    private readonly updateSessionSql: StatementSync;

    public constructor() {
        super();

        this.db = this.connectionProvider.getConnection(this.variable.SESSION_STORE);
        this.initializeDatabase();
        this.getCountSql = this.db.prepare('SELECT COUNT(*) as count FROM sessionData');
        this.getSessionsSql = this.db.prepare('SELECT id, session FROM sessionData');
        this.deleteSessionSql = this.db.prepare('DELETE FROM sessionData WHERE id = ?');
        this.getSessionSql = this.db.prepare('SELECT session FROM sessionData WHERE id = ?');
        this.setSessionSql = this.db.prepare(
            `INSERT INTO sessionData (id, user_id, session, lastAccessAt)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET user_id=?, session=?, lastAccessAt=?`,
        );

        this.updateSessionSql = this.db.prepare(
            `UPDATE sessionData SET user_id = ?, session = ?, lastAccessAt = ? WHERE id = ?`,
        );

        this.logger.info(`Using SQLite session store "${this.variable.SESSION_STORE}"`);
    }

    public override get(
        sessionId: string,
        callback: (err: unknown, session?: session.SessionData | null) => void,
    ): void {
        try {
            const sessionData = this.getSessionData(sessionId);
            if (callback) {
                callback(null, sessionData ?? null);
            }
        } catch (error) {
            if (callback) {
                callback(error);
            }
        }
    }

    public override set(sessionId: string, session: session.SessionData, callback?: (err?: unknown) => void): void {
        try {
            this.setSessionData(sessionId, session);
            if (callback) {
                callback();
            }
        } catch (error) {
            if (callback) {
                callback(error);
            }
        }
    }

    public override destroy(sessionId: string, callback?: (err?: unknown) => void): void {
        try {
            this.deleteSessionData(sessionId);
            if (callback) {
                callback();
            }
        } catch (error) {
            if (callback) {
                callback(error);
            }
        }
    }

    public override touch(sessionId: string, session: session.SessionData, callback?: (err?: unknown) => void): void {
        try {
            this.touchSessionData(sessionId, session);
            if (callback) {
                callback();
            }
        } catch (error) {
            if (callback) {
                callback(error);
            }
        }
    }

    public override clear(callback?: (err?: unknown) => void): void {
        try {
            this.db.exec('DELETE FROM sessionData');
            if (callback) {
                callback();
            }
        } catch (error) {
            if (callback) {
                callback(error);
            }
        }
    }

    public override length(callback: (err: unknown, length?: number) => void): void {
        try {
            const result = this.getCountSql.get() as { count: number };
            if (callback) {
                callback(null, result.count);
            }
        } catch (error) {
            if (callback) {
                callback(error);
            }
        }
    }

    public override all(
        callback: (err: unknown, obj?: session.SessionData[] | { [sid: string]: session.SessionData } | null) => void,
    ): void {
        try {
            const rows = this.getSessionsSql.all() as Array<{
                id: string;
                session: string;
            }>;

            const sessions: { [sid: string]: session.SessionData } = {};
            for (const row of rows) {
                sessions[row.id] = JSON.parse(row.session);
            }

            if (callback) {
                callback(null, sessions);
            }
        } catch (error) {
            if (callback) {
                callback(error);
            }
        }
    }

    private initializeDatabase(): void {
        this.db.exec(initDatabase);
    }

    private deleteSessionData(id: string): void {
        this.deleteSessionSql.run(id);
    }

    private getSessionData(id: string): session.SessionData | undefined {
        const row = this.getSessionSql.get(id) as { session: string } | undefined;
        return row ? JSON.parse(row.session) : undefined;
    }

    private setSessionData(id: string, data: session.SessionData): void {
        const cookie = isToJson(data.cookie) ? data.cookie.toJSON(data.cookie) : data.cookie;
        const ttl = this.getTTL(data);
        if (ttl <= 0) {
            this.deleteSessionData(id);
            return;
        }

        const now = new Date().toISOString();
        const sessionJson = JSON.stringify({ ...data, cookie });
        const userId = data.user_id ?? null;
        this.setSessionSql.run(id, userId, sessionJson, now, userId, sessionJson, now);
    }

    private touchSessionData(id: string, data: session.SessionData): void {
        const cookie = isToJson(data.cookie) ? data.cookie.toJSON(data.cookie) : data.cookie;
        const now = new Date().toISOString();
        const sessionJson = JSON.stringify({ ...data, cookie });
        const userId = data.user_id ?? null;
        this.updateSessionSql.run(userId, sessionJson, now, id);
    }
}
