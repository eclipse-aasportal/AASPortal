/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import Transport from 'winston-transport';

export class ConsoleTransport extends Transport {
    public override log = (info: { level: string; message: string }, callback: () => void) => {
        setImmediate(() => this.emit('logged', info));

        if (info.level === 'error') {
            console.error(info.message);
        } else if (info.level === 'warn') {
            console.warn(info.message);
        } else {
            console.info(info.message);
        }

        if (callback) {
            callback();
        }
    };
}
