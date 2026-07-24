/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, AASEndpoint, UserRole, EndpointAuth } from 'aas-core';
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

export const EndpointScanMessageKind = {
    Start: 0,
    Add: 1,
    Remove: 2,
    Update: 3,
    End: 4,
} as const;

export type EndpointScanMessageKind = (typeof EndpointScanMessageKind)[keyof typeof EndpointScanMessageKind];

/** The result of an endpoint scan. */
export type EndpointScanMessage = {
    type: 'EndpointScanMessage';
    taskId: number;
    endpoint: string;
    /** The start time. */
    start: number;
} & (
    | {
          kind: 'Start' | 'End';
      }
    | {
          kind: 'Added' | 'Updated' | 'Removed';
          document: AASDocument;
      }
);

export interface WorkerData {
    taskId: number;
    type: 'EndpointScanData' | 'CancelEndpointScanData';
}

export interface EndpointScanData extends WorkerData {
    type: 'EndpointScanData';
    endpoint: AASEndpoint;
}

export interface CancelEndpointScanData extends WorkerData {
    type: 'CancelEndpointScanData';
    endpoint: string;
}

export function isEndpointScanData(data: WorkerData): data is EndpointScanData {
    return data.type === 'EndpointScanData';
}

export function isCancelEndpointScanData(data: WorkerData): data is CancelEndpointScanData {
    return data.type === 'CancelEndpointScanData';
}

export type EventListener = (...args: unknown[]) => void;
