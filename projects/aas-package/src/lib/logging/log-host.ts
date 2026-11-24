/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { fork, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export interface LogHost {
    endpoint: string;
    child: ChildProcess;
    stop: () => Promise<void>;
}

export async function startLogHost(endpoint: string): Promise<LogHost> {
    const child: ChildProcess = fork(fileURLToPath(new URL('./log-server.js', import.meta.url)), {
        env: { ...process.env, LOG_ENDPOINT: endpoint },
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

        child.once('exit', (code: number | null): void => reject(new Error(`log-server : ${code}`)));
    });

    const stop = (): Promise<void> =>
        new Promise<void>((resolve): void => {
            child.once('exit', (): void => resolve());
            child.kill('SIGTERM');
        });

    return { endpoint, child, stop };
}
