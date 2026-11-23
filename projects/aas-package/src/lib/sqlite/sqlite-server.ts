/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DatabaseSync, SQLInputValue, type StatementSync } from 'node:sqlite';
import net from 'node:net';
import readline from 'node:readline';
import { existsSync, unlinkSync } from 'node:fs';
import { decode, encode, SqlParam, type Request, type Response } from './sqlite-protocols.js';
import { noop } from 'aas-core';

const dbPath = process.env.DB_PATH;
const endpoint = process.env.DB_ENDPOINT;
if (!dbPath || !endpoint) throw new Error('DB_PATH and DB_ENDPOINT should be set');

const isPipe = process.platform === 'win32';
if (!isPipe && existsSync(endpoint)) {
    unlinkSync(endpoint);
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA busy_timeout = 5000');
db.exec('PRAGMA foreign_keys = ON');

let cache = new Map<string, StatementSync>();
const MAX_CACHE = 256;

function prepare(sql: string): StatementSync {
    let statement = cache.get(sql);
    if (!statement) {
        if (cache.size >= MAX_CACHE) {
            cache = new Map();
        }

        statement = db.prepare(sql);
        cache.set(sql, statement);
    }
    return statement;
}

const norm = (p: SqlParam[]): SQLInputValue[] => p.map(v => (typeof v === 'boolean' ? (v ? 1 : 0) : v));

type Tx = { depth: number };

function handle(req: Request, tx: Tx): unknown {
    switch (req.type) {
        case 'ping':
            return 'pong';

        case 'exec':
            db.exec(req.sql);
            cache = new Map();
            return null;

        case 'run': {
            const r = prepare(req.sql).run(...norm(req.params ?? []));
            return { changes: Number(r.changes), lastInsertRowid: String(r.lastInsertRowid) };
        }

        case 'all':
            return prepare(req.sql).all(...norm(req.params ?? []));

        case 'get':
            return prepare(req.sql).get(...norm(req.params ?? [])) ?? null;

        case 'begin':
            if (tx.depth === 0) {
                db.exec('BEGIN IMMEDIATE');
            } else {
                db.exec(`SAVEPOINT sp_${tx.depth}`);
            }

            tx.depth++;
            return null;

        case 'commit': {
            if (tx.depth === 0) {
                throw new Error('No active transaction context');
            }

            tx.depth--;
            if (tx.depth === 0) {
                db.exec('COMMIT');
            } else {
                db.exec(`RELEASE sp_${tx.depth}`);
            }

            return null;
        }

        case 'rollback': {
            if (tx.depth === 0) {
                throw new Error('No active transaction context');
            }

            const target = tx.depth - 1;
            tx.depth--;
            if (tx.depth === 0) {
                db.exec('ROLLBACK');
            } else {
                db.exec(`ROLLBACK TO sp_${target}`);
                db.exec(`RELEASE sp_${target}`);
            }

            return null;
        }
    }

    return null;
}

const server = net.createServer(socket => {
    socket.setEncoding('utf8');
    const tx: Tx = { depth: 0 };
    const rl = readline.createInterface({ input: socket, crlfDelay: Infinity });

    rl.on('line', line => {
        if (!line.trim()) return;
        let req: Request;
        try {
            req = decode<Request>(line);
        } catch {
            socket.write(encode({ id: -1, ok: false, error: { message: 'invalid JSON' } }) + '\n');
            return;
        }
        try {
            const result = handle(req, tx);
            socket.write(encode({ id: req.id, ok: true, result }) + '\n');
        } catch (err) {
            const e = err as Error & { code?: string };
            const res: Response = { id: req.id, ok: false, error: { message: e.message, code: e.code } };
            socket.write(encode(res) + '\n');
        }
    });

    socket.on('close', () => {
        if (tx.depth > 0) {
            try {
                db.exec('ROLLBACK');
            } catch {
                noop();
            }
        }
    });

    socket.on('error', () => {
        noop();
    });
});

server.listen(endpoint, () => process.send?.({ type: 'ready', endpoint }));
