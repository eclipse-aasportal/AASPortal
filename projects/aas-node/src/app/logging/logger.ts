/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Message, MessageType } from 'aas-core';
import { singleton } from 'tsyringe';

/**
 * Defines a logger interface.
 */
export abstract class Logger {
    /**
     * Logs an error.
     * @param error
     * @param args Additional arguments.
     */
    public abstract error(error: Error | string, ...args: unknown[]): void;

    /**
     * Logs a warning.
     * @param message The message format.
     * @param args The format items.
     */
    public abstract warning(message: string, ...args: unknown[]): void;

    /**
     * Logs an information.
     * @param message The message format.
     * @param args The format items.
     */
    public abstract info(message: string, ...args: unknown[]): void;

    /**
     * Logs a debug message.
     * @param message The message format.
     * @param args The format items.
     */
    public abstract debug(message: Error | string, ...args: unknown[]): void;

    /**
     * Logs the specified message.
     * @param message The message.
     */
    public abstract log(message: Message): void;

    /**
     * Starts the message recording for the specified context.
     * @param context The context name.
     * @returns `true` if the recording is started.
     */
    public abstract start(context: string): boolean;

    /**
     * Stops the message recording.
     */
    public abstract stop(): void;

    /**
     * Returns all messages.
     */
    public abstract getMessages(): Message[];
}

export function createMessage(type: MessageType, text: string, timestamp: number): Message {
    return { type, text, timestamp };
}

/** Represents a console for debug messages. */
@singleton()
export class DebugConsole {
    public debug(message: string | Error): void {
        console.debug(message);
    }
}
