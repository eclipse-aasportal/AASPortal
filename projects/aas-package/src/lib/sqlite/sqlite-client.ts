/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import net from 'node:net';
import readline from 'node:readline';
import { encode, decode, type Request, type RequestPayload, type SqlParam, type Response } from './sqlite-protocols.js';

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };

export class SqliteClient {
    private socket: net.Socket;
    private rl: readline.Interface;
    private nextId = 1;
    private pending = new Map<number, Pending>();
    private queue: Promise<unknown> = Promise.resolve();
    private txChain: Promise<unknown> = Promise.resolve();

    private constructor(socket: net.Socket) {
        this.socket = socket;
        this.socket.setEncoding('utf8');
        this.rl = readline.createInterface({ input: socket, crlfDelay: Infinity });

        this.rl.on('line', line => {
            const res = decode<Response>(line);
            const p = this.pending.get(res.id);
            if (!p) {
                return;
            }

            this.pending.delete(res.id);
            if (res.ok) {
                p.resolve(res.result);
            } else {
                p.reject(Object.assign(new Error(res.error.message), { code: res.error.code }));
            }
        });

        const fail = (e: Error): void => {
            for (const p of this.pending.values()) {
                p.reject(e);
            }

            this.pending.clear();
        };

        socket.on('close', () => fail(new Error('DB connection closed')));
        socket.on('error', fail);
    }

    public static connect(endpoint: string, retries = 50): Promise<SqliteClient> {
        return new Promise((resolve, reject) => {
            const attempt = (n: number): void => {
                const s = net.connect(endpoint);
                s.once('connect', () => {
                    s.removeAllListeners('error');
                    resolve(new SqliteClient(s));
                });

                s.once('error', e => {
                    s.destroy();
                    if (n <= 0) {
                        reject(e);
                    } else {
                        setTimeout(() => attempt(n - 1), 100);
                    }
                });
            };

            attempt(retries);
        });
    }

    public ping(): Promise<string> {
        return this.send<string>({ type: 'ping' });
    }

    public exec(sql: string): Promise<null> {
        return this.send<null>({ type: 'exec', sql });
    }

    public run(sql: string, params: SqlParam[] = []): Promise<{ changes: number; lastInsertRowid: string }> {
        return this.send<{ changes: number; lastInsertRowid: string }>({ type: 'run', sql, params });
    }

    public all<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): Promise<T[]> {
        return this.send<T[]>({ type: 'all', sql, params });
    }

    public get<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): Promise<T | null> {
        return this.send<T | null>({ type: 'get', sql, params });
    }

    public transaction<T>(fn: (c: SqliteClient) => Promise<T>): Promise<T> {
        const run = async (): Promise<T> => {
            await this.send<null>({ type: 'begin' });
            try {
                const result = await fn(this);
                await this.send<null>({ type: 'commit' });
                return result;
            } catch (err) {
                await this.send<null>({ type: 'rollback' }).catch(() => {});
                throw err;
            }
        };

        const p = this.txChain.then(run, run);
        this.txChain = p.catch(() => {});
        return p;
    }

    public close(): void {
        this.socket.end();
    }

    private send<T>(req: RequestPayload): Promise<T> {
        const run = (): Promise<T> =>
            new Promise<T>((resolve, reject) => {
                const id = this.nextId++;
                this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
                this.socket.write(encode({ ...req, id } as Request) + '\n');
            });

        const p = this.queue.then(run, run);
        this.queue = p.catch(() => {});
        return p;
    }
}
