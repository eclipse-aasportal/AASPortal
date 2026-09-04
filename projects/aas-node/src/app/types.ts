/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASEndpointAuth, SessionUser, UserRole } from 'aas-core';

/** Extend Express Request type to include 'user' */
declare module 'express-serve-static-core' {
    interface Request {
        user?: SessionUser;
    }
}

declare module 'express-session' {
    interface SessionData {
        user_id: string;
        name: string;
        role: UserRole;
        access_token: string;
        refresh_token: string;
        expires_at: number;
        code_verifier: string;
        endpoints: AASEndpointAuth[];
        session_state: string;
        check_session_iframe: string;
        state: string;
    }
}

/** The data sent to and from a worker thread. */
export interface WorkerData {
    /** The application for which the data is intended. */
    application: string;
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

export type EventListener = (...args: unknown[]) => void;
