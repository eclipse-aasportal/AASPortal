/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Disposable } from 'tsyringe';
import { MessagePort } from 'worker_threads';

export type FileResult = {
    filename: string;
    value: string;
    readable: NodeJS.ReadableStream;
    size?: number;
    contentType?: string;
};

export interface HTMLDocumentElement extends HTMLElement {
    _nsMap: { [key: string]: string };
}

/** Checks if an object is disposable. */
export function isDisposable(obj: unknown): obj is Disposable {
    return (
        typeof obj === 'object' && obj !== null && 'dispose' in obj && typeof (obj as Disposable).dispose === 'function'
    );
}

/**
 * Represents an object that can be connected to a worker thread.
 */
export interface Connectable {
    /**
     * Connects the object to a worker thread using the specified message port.
     * @param port The message port used to connect to the worker thread.
     * @param name The name of the worker thread.
     */
    connect(port: MessagePort, name?: string): void;
}

/** Checks if an object is connectable. */
export function isConnectable(obj: unknown): obj is Connectable {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'connect' in obj &&
        typeof (obj as Connectable).connect === 'function'
    );
}

/** The data sent to and from a worker thread. */
export interface WorkerData {
    /** The type of the data. */
    type: 'command' | 'response' | 'event' | 'error';
}

export interface EventData extends WorkerData {
    type: 'event';
    name: string;
    args: Record<string, unknown>;
}

export interface CommandData extends WorkerData {
    type: 'command';
    name: string;
    args: Record<string, unknown>;
}

export interface ResponseData extends WorkerData {
    type: 'response';
    command: string;
    result: unknown;
}

export interface ErrorData extends WorkerData {
    type: 'error';
    message: string;
    stack?: string;
}

export function isCommandData(data: WorkerData): data is CommandData {
    return data.type === 'command';
}

export function isResponseData(data: WorkerData): data is ResponseData {
    return data.type === 'response';
}

export function isEventData(data: WorkerData): data is EventData {
    return data.type === 'event';
}

export function isErrorData(data: WorkerData): data is ErrorData {
    return data.type === 'error';
}
