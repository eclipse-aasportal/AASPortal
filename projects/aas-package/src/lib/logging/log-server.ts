/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import net from 'net';
import readline from 'readline';
import { existsSync, unlinkSync } from 'fs';
import { noop } from 'aas-core';
import { LogMessage } from './logger.js';

const endpoint = process.env.LOG_ENDPOINT;
if (!endpoint) {
    throw new Error('LOG_ENDPOINT should be set');
}

const isPipe = process.platform === 'win32';
if (!isPipe && existsSync(endpoint)) {
    unlinkSync(endpoint);
}

function handle(msg: unknown): void {
    if (!isLogMessage(msg)) {
        return;
    }

    const formatted = `${getDateTime(msg.timestamp)} [${msg.type}] (pid:${msg.pid}): ${msg.text}`;

    switch (msg.type) {
        case 'Error':
            console.error(formatted);
            break;

        case 'Warning':
            console.warn(formatted);
            break;

        default:
            console.info(formatted);
            break;
    }

    function isLogMessage(msg: unknown): msg is LogMessage {
        return (
            msg !== null &&
            typeof msg === 'object' &&
            typeof (msg as LogMessage).type === 'string' &&
            typeof (msg as LogMessage).text === 'string' &&
            typeof (msg as LogMessage).timestamp === 'number' &&
            typeof (msg as LogMessage).pid === 'number'
        );
    }

    function getDateTime(timestamp: number): string {
        const value = new Date(timestamp).toISOString().replace('T', ' ');
        return value.substring(0, value.lastIndexOf('.'));
    }
}

const server = net.createServer(socket => {
    socket.setEncoding('utf8');
    const rl = readline.createInterface({ input: socket, crlfDelay: Infinity });

    rl.on('line', line => {
        if (!line.trim()) {
            return;
        }

        try {
            handle(JSON.parse(line));
        } catch {
            handle({ type: 'error', text: 'invalid JSON', timestamp: Date.now(), pid: process.pid });
        }
    });

    socket.on('close', () => {
        noop();
    });

    socket.on('error', () => {
        noop();
    });
});

server.listen(endpoint, () => process.send?.({ type: 'ready', endpoint }));
