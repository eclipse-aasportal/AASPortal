/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { UserRole, EndpointAuth } from 'aas-core';
import { aasV2 } from 'aas-package';

/** Extend Express Request type to include 'user' */
declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            id: string;
            name: string;
            role: UserRole;
            endpoints?: EndpointAuth[];
        };
    }
}

declare module 'express-session' {
    interface SessionData {
        access_token?: string;
        refresh_token?: string;
        code_verifier?: string;
        endpoints?: EndpointAuth[];
        session_state?: string;
        check_session_iframe?: string;
        state?: string;
    }
}

export interface AASRegistryModelType {
    name: 'AssetAdministrationShellDescriptor' | 'Asset';
}

/** Defines the supported endpoint types. */
export type EndpointType = 'file' | 'http' | 'opc';

/** Represents an endpoint of an AAS resource. */
export interface EndpointDescriptor {
    address: string;
    type: EndpointType;
}

/** The self-describing information of a network resource. */
export interface AASRegistryDescriptor {
    endpoints: EndpointDescriptor[];
}

/** Descriptor of a Submodel. */
export interface SubmodelDescriptor extends AASRegistryDescriptor {
    identification: aasV2.Identifier;
    idShort: string;
}

/** Descriptor of an Asset. */
export interface AssetDescriptor extends AASRegistryDescriptor {
    modelType: AASRegistryModelType;
    identification: aasV2.Identifier;
    idShort: string;
}

/** Descriptor of an Asset Administration Shell */
export interface AssetAdministrationShellDescriptor extends AASRegistryDescriptor {
    modelType: AASRegistryModelType;
    identification: aasV2.Identifier;
    idShort: string;
    asset: AssetDescriptor;
    submodels: SubmodelDescriptor[];
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
