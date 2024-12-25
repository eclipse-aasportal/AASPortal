/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import winston from 'winston';
import { stringFormat, Message } from 'aas-core';
import { createMessage, Logger } from './logger.js';

interface Record {
    errors: Map<string, number>;
    warnings: Map<string, number>;
    messages: Map<string, number>;
}

/**
 * Realizes the logger service.
 */
@singleton()
export class FileLogger extends Logger {
    private readonly records = new Map<string, Record>();
    private readonly defaultRecord: Record = {
        errors: new Map<string, number>(),
        warnings: new Map<string, number>(),
        messages: new Map<string, number>(),
    };

    private record = this.defaultRecord;
    private recording = 0;
    private context: string | null = null;

    public constructor(@inject('winston.Logger') private readonly logger: winston.Logger) {
        super();
    }

    public override error(error: Error | string, ...args: unknown[]): void {
        if (this.logger.isErrorEnabled()) {
            let text: string | null = null;
            if (error) {
                if (error instanceof Error) {
                    text = error.message;
                } else if (typeof error === 'string') {
                    text = stringFormat(error, args);
                }
            }

            if (text) {
                if (!this.record.errors.has(text)) {
                    this.logger.error(text);
                }

                this.record.errors.set(text, Date.now());
            }
        }
    }

    public override warning(message: string, ...args: unknown[]): void {
        if (this.logger.isWarnEnabled()) {
            let text: string | null = null;
            if (typeof message === 'string') {
                text = stringFormat(message, args);
            }

            if (text) {
                if (!this.record.warnings.has(text)) {
                    this.logger.warn(text);
                }

                this.record.warnings.set(text, Date.now());
            }
        }
    }

    public override info(message: string, ...args: unknown[]): void {
        if (this.logger.isInfoEnabled()) {
            let text: string | null = null;
            if (typeof message === 'string') {
                text = stringFormat(message, args);
            }

            if (text) {
                if (!this.record.messages.has(text)) {
                    this.logger.info(text);
                }

                this.record.messages.set(text, Date.now());
            }
        }
    }

    public override debug(message: Error | string, ...args: unknown[]): void {
        if (this.logger.isDebugEnabled()) {
            let text: string | null = null;
            if (message) {
                if (message instanceof Error) {
                    text = message.message;
                } else if (typeof message === 'string') {
                    text = stringFormat(message, args);
                }
            }

            if (text) {
                this.logger.debug(text);
            }
        }
    }

    public override log(message: Message): void {
        switch (message.type) {
            case 'Error':
                if (this.logger.isErrorEnabled()) {
                    this.record.errors.set(message.text, message.timestamp);
                }
                break;
            case 'Warning':
                if (this.logger.isWarnEnabled()) {
                    this.record.warnings.set(message.text, message.timestamp);
                }
                break;
            default:
                if (this.logger.isInfoEnabled()) {
                    this.record.messages.set(message.text, message.timestamp);
                }
                break;
        }
    }

    public override start(context: string): boolean {
        if (this.recording === 0) {
            this.context = context;
            let record = this.records.get(this.context);
            if (!record) {
                record = {
                    errors: new Map<string, number>(),
                    warnings: new Map<string, number>(),
                    messages: new Map<string, number>(),
                };

                this.records.set(context, record);
            }

            this.record = record;
        }

        ++this.recording;

        return this.recording === 1;
    }

    public override stop(): void {
        if (this.recording === 1) {
            this.recording = 0;
            this.record = this.defaultRecord;
        } else if (this.recording > 1) {
            --this.recording;
        }
    }

    public override getMessages(): Message[] {
        const messages: Message[] = [];
        for (const record of [...this.records.values(), this.defaultRecord]) {
            for (const tuple of record.errors) {
                messages.push(createMessage('Error', tuple[0], tuple[1]));
            }

            for (const tuple of record.warnings) {
                messages.push(createMessage('Warning', tuple[0], tuple[1]));
            }

            for (const tuple of record.messages) {
                messages.push(createMessage('Info', tuple[0], tuple[1]));
            }
        }

        return messages.sort((a, b) => a.timestamp - b.timestamp);
    }
}
