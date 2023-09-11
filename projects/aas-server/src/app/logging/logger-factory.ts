/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import fs from 'fs';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { isMainThread } from 'worker_threads';
import { noop } from 'lodash-es';
import { DependencyContainer } from 'tsyringe';

/* istanbul ignore next */
export class LoggerFactory {
    constructor(private readonly container: DependencyContainer) {
    }

    public create(): winston.Logger {
        const filename = path.resolve('.', 'aas-server-%DATE%.log');
        if (isMainThread) {
            this.deleteLogFiles();
        }

        const transport: DailyRotateFile = new DailyRotateFile({
            filename: filename,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: false,
            maxSize: '20m',
            maxFiles: '2d',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json())
        });

        const logger = winston.createLogger({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            transports: [transport],
        });

        if (process.env.NODE_ENV !== 'production') {
            logger.add(new winston.transports.Console({
                format: winston.format.simple(),
            }));
        }

        return logger;
    }

    private deleteLogFiles(): void {
        const dir = path.resolve('.');
        for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
            if (file.isFile() && path.extname(file.name) === '.log' && file.name.startsWith('aas-server')) {
                try {
                    fs.rmSync(path.join(dir, file.name));
                } catch (error) {
                    noop();
                }
            }
        }
    }
}