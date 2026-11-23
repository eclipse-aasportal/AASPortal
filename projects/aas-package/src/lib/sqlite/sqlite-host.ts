/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { fork, type ChildProcess } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

function defaultEndpoint(): string {
    const name = `sqlite-${randomBytes(4).toString('hex')}`;
    return process.platform === 'win32' ? `\\\\.\\pipe\\${name}` : join(tmpdir(), `${name}.sock`);
}

export interface SqliteHost {
    endpoint: string;
    child: ChildProcess;
    stop: () => Promise<void>;
}

export async function startSqliteHost(dbPath: string, endpoint = defaultEndpoint()): Promise<SqliteHost> {
    const child: ChildProcess = fork(fileURLToPath(new URL('./sqlite-server.js', import.meta.url)), {
        env: { ...process.env, DB_PATH: dbPath, DB_ENDPOINT: endpoint },
        stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    });

    await new Promise<void>((resolve, reject) => {
        child.once('message', (message: { type: string }): void => {
            if (message.type === 'ready') {
                resolve();
            } else {
                reject(new Error('unexpected message'));
            }
        });

        child.once('exit', (code: number | null): void => reject(new Error(`sqlite-server : ${code}`)));
    });

    const stop = (): Promise<void> =>
        new Promise<void>((resolve): void => {
            child.once('exit', (): void => resolve());
            child.kill('SIGTERM');
        });

    return { endpoint, child, stop };
}
