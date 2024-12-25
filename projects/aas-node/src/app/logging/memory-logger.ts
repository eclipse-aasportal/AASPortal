/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { Message, stringFormat } from 'aas-core';
import { createMessage, DebugConsole, Logger } from './logger.js';

export enum MemoryLoggerLevel {
    All = 0,
    Debug = 1,
    Info = 2,
    Warning = 3,
    Error = 4,
    Non = 5,
}

@singleton()
export class MemoryLogger extends Logger {
    private readonly errors = new Map<string, number>();
    private readonly warnings = new Map<string, number>();
    private readonly messages = new Map<string, number>();
    private recording = 0;

    public constructor(
        @inject('LOG_LEVEL') private readonly logLevel: MemoryLoggerLevel,
        @inject(DebugConsole) private readonly console: DebugConsole,
    ) {
        super();
    }

    public error(error: string | Error, ...args: unknown[]): void {
        if (this.logLevel <= MemoryLoggerLevel.Error) {
            let text: string | undefined;
            if (error) {
                if (error instanceof Error) {
                    text = error.message;
                } else if (typeof error === 'string') {
                    text = stringFormat(error, args);
                }

                if (text) {
                    this.errors.set(text, Date.now());
                }
            }
        }
    }

    public warning(message: string, ...args: unknown[]): void {
        if (this.logLevel <= MemoryLoggerLevel.Warning) {
            if (typeof message === 'string') {
                this.warnings.set(stringFormat(message, args), Date.now());
            }
        }
    }

    public info(message: string, ...args: unknown[]): void {
        if (this.logLevel <= MemoryLoggerLevel.Info) {
            if (typeof message === 'string') {
                this.messages.set(stringFormat(message, args), Date.now());
            }
        }
    }

    public debug(message: string | Error, ...args: unknown[]): void {
        if (this.logLevel <= MemoryLoggerLevel.Debug) {
            {
                let text: string | undefined;
                if (message) {
                    if (message instanceof Error) {
                        text = message.message;
                    } else if (typeof message === 'string') {
                        text = stringFormat(message, args);
                    }
                }

                if (text) {
                    this.console.debug(text);
                }
            }
        }
    }

    public log(message: Message): void {
        switch (message.type) {
            case 'Error':
                if (this.logLevel <= MemoryLoggerLevel.Error) {
                    this.errors.set(message.text, message.timestamp);
                }
                break;
            case 'Warning':
                if (this.logLevel <= MemoryLoggerLevel.Warning) {
                    this.warnings.set(message.text, message.timestamp);
                }
                break;
            default:
                if (this.logLevel <= MemoryLoggerLevel.Info) {
                    this.messages.set(message.text, message.timestamp);
                }
                break;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public start(context: string): boolean {
        if (this.recording === 0) {
            this.errors.clear();
            this.warnings.clear();
            this.messages.clear();
        }

        ++this.recording;

        return this.recording === 1;
    }

    public stop(): void {
        if (this.recording === 1) {
            this.recording = 0;
        } else if (this.recording > 1) {
            --this.recording;
        }
    }

    public getMessages(): Message[] {
        const messages: Message[] = [];
        for (const tuple of this.errors) {
            messages.push(createMessage('Error', tuple[0], tuple[1]));
        }

        for (const tuple of this.warnings) {
            messages.push(createMessage('Warning', tuple[0], tuple[1]));
        }

        for (const tuple of this.messages) {
            messages.push(createMessage('Info', tuple[0], tuple[1]));
        }

        return messages.sort((a, b) => a.timestamp - b.timestamp);
    }
}
